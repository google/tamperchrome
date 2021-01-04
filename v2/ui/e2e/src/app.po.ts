import { browser, by, element } from 'protractor';
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';


export class AppPage {
  private diffs = [];
  async waitForMessage(): Promise<{data: any; ports: Array<number>}> {
    return browser.executeAsyncScript((callback) => {
      const msgs = window['.msgs'];
      if (msgs.length === 0) {
        msgs.push = (e) => {
          delete msgs.push;
          callback(e);
        };
      } else {
        callback(msgs.unshift());
      }
    });
  }

  async waitForMessageToPort(portId: number): Promise<{data: any; ports: Array<number>}> {
    return browser.executeAsyncScript((portIdParam, callback) => {
      const ports = window['.ports'];
      ports[portIdParam].onmessage = (e) => {
        callback({data: e.data, ports: e.ports.map(port=>ports.push(port)-1)});
      };
    }, portId);
  }

  postMessageToPort(portId: number, msg: any) {
    browser.executeScript((portIdParam, msgParam) => {
      const ports = window['.ports'];
      ports[portIdParam].postMessage(msgParam);
    }, portId, msg);
  }

  async createMessageChannel(): Promise<[number, number]> {
    return browser.executeScript(() => {
      const mc = new MessageChannel();
      const ports = window['.ports'];
      return [ports.push(mc.port1)-1, ports.push(mc.port2)-1];
    });
  }

  async postMessage(msg: any, portIds: Array<number>) {
    await browser.executeScript((msgParam, portIdsParam) => {
      const ports = portIdsParam.map(id=>window['.ports'][id]);
      postMessage(msgParam, location.origin, ports);
    }, msg, portIds);
  }

  async navigateTo() {
    await browser.driver.sendChromiumCommand('Accessibility.enable', {});
    await browser.get(browser.baseUrl);
    await browser.driver.executeScript(() => {
      const ports = window['.ports'] = [];
      const msgs = window['.msgs'] = [];
      window.addEventListener('message', (event) => {
        const portRefs = event.ports.map(port=>ports.push(port)-1);
        msgs.push({data: event.data, ports: portRefs});
      });
    });
  }

  async snap(name: string) {
    if (!name.match(/^[a-z0-9-]+$/i)) {throw new Error('name must be alphanum.');}
    const path = `${__dirname}/goldens`;
    await browser.waitForAngular();
    const pic = await browser.takeScreenshot();
    const snap = await this.takeSnapshot();
    const proc = spawnSync('diff', ['-N', name, '-'], {
      cwd: path, input: snap, encoding: 'UTF-8'});
    const diff = proc.stdout;
    writeFileSync(`${path}/${name}.patch`, diff);
    writeFileSync(`${path}/${name}.png`, Buffer.from(pic.replace(/data:[^,]+,/,''), 'base64'));
    if (diff) {
      this.diffs.push({name, diff});
    }
    return diff;
  }

  getDiffs() {
    return this.diffs.slice();
  }

  private async takeDevtoolsSnapshot() {
    return browser.driver.sendChromiumCommandAndGetResult('Accessibility.getFullAXTree', {});
  }

  private toTree(devToolsSnapshot) {
    const leaves = new Map();
    const root = devToolsSnapshot.nodes[0].nodeId;
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
    return leaves.get(root);
  }

  private serializeTree(tree, padding = 0) {
    if (tree.ignored || tree.props.includes('hidden=true')) {return '';}
    const inlined = tree.role === 'generic';
    const head = `${
      tree.role
    }${
      JSON.stringify(tree.props)
    }${
      JSON.stringify(tree.attrs)
    }`;
    const body = tree.children.map(
      child=>this.serializeTree(child, padding + (inlined?0:1))).join('');
    return `${
      inlined?'':`${'.'.repeat(padding)}${head}\n`
    }${
      body
    }`;
  }

  private async takeSnapshot() {
    return this.serializeTree(this.toTree(await this.takeDevtoolsSnapshot()));
  }
}
