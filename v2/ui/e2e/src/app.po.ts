import { browser, by, element } from 'protractor';

export class AppPage {
  async navigateTo() {
    await browser.driver.sendChromiumCommand('Accessibility.enable', {});
    return browser.get(browser.baseUrl);
  }

  async takeDevtoolsSnapshot() {
    return browser.driver.sendChromiumCommandAndGetResult('Accessibility.getFullAXTree', {});
  }

  toTree(devToolsSnapshot) {
    const leaves = new Map;
    for(const node of devToolsSnapshot.nodes) {
      leaves.set(node.nodeId, {});
    }
    for(const node of devToolsSnapshot.nodes) {
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

  serializeTree(tree, spaces = 0) {
    if (tree.ignored || tree.props.includes('hidden=true')) return '';
    const head = `${
      tree.role
    }${
      JSON.stringify(tree.props)
    }${
      JSON.stringify(tree.attrs)
    }`;
    const body = tree.children.map(child=>this.serializeTree(child, spaces + 1)).join('');
    return `${
      head != 'generic[]{}' ? `${' '.repeat(spaces)}${head}\n` : ''
    }${
      body
    }`;
  }

  async takeSnapshot() {
    return this.serializeTree(this.toTree(await this.takeDevtoolsSnapshot()));
  }
}
