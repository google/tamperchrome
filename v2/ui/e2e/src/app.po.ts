import { browser, by, element } from 'protractor';
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

export class AppPage {
  private diffs = []
  getDiffs() {
    this.diffs.sort((a,b)=>a.name<b.name?-1:1);
    return this.diffs.slice();
  }
  async navigateTo() {
    await browser.driver.sendChromiumCommand('Accessibility.enable', {});
    return browser.get(browser.baseUrl);
  }

  private async takeDevtoolsSnapshot() {
    return browser.driver.sendChromiumCommandAndGetResult('Accessibility.getFullAXTree', {});
  }

  private toTree(devToolsSnapshot) {
    const leaves = new Map;
    for (const node of devToolsSnapshot.nodes) {
      leaves.set(node.nodeId, {});
    }
    for (const node of devToolsSnapshot.nodes) {
      const leaf = leaves.get(node.nodeId);
      leaf.ignored = node.ignored;
      leaf.role = node.role?.value;
      leaf.attrs = {
        name: node.name?.value || undefined,
        description: node.description?.value || undefined,
        value: node.value?.value || undefined
      };
      leaf.children = node.childIds.map(id=>leaves.get(id));
      leaf.props = node.properties.filter(prop=>prop.value?.value).map(prop=>`${prop.name}=${prop.value.value}`);
    }
    return leaves.get("1");
  }

  private serializeTree(tree, padding = 0) {
    if (tree.ignored || tree.props.includes('hidden=true')) return '';
    const head = `${
      tree.role
    }${
      JSON.stringify(tree.props)
    }${
      JSON.stringify(tree.attrs)
    }`;
    const body = tree.children.map(child=>this.serializeTree(child, padding + 1)).join('');
    return `${
      head != 'generic[]{}' ? `${'.'.repeat(padding)}${head}\n` : ''
    }${
      body
    }`;
  }

  private async takeSnapshot() {
    return this.serializeTree(this.toTree(await this.takeDevtoolsSnapshot()));
  }

  async snap(name: string) {
    if (!name.match(/^[a-z0-9-]+$/i)) throw new Error('name must be alphanum.');
    const path = `${__dirname}/goldens`;
    const snap = await this.takeSnapshot();
    const proc = spawnSync('diff', ['-N', name, '-'], {cwd: path, input: snap, encoding: 'UTF-8'});
    const diff = proc.stdout;
    writeFileSync(`${path}/${name}.patch`, diff);
    if (diff) {
      this.diffs.push({name, diff});
    }
    return diff;
  }
}
