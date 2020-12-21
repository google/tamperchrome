import { browser, by, element } from 'protractor';
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';
import { callbackify } from 'util';

export class AppPage {
  async waitForMessage(): Promise<{data: any, ports: Array<number>}> {
    return browser.executeAsyncScript(function() {
      const callback = arguments[arguments.length - 1];
      const __msgs = window['__msgs'];
      if (__msgs.length == 0) {
        __msgs.push = function(e) {
          delete __msgs.push;
          callback(e);
        };
      } else {
        callback(__msgs.unshift());
      }
    });
  }

  async waitForMessageToPort(portId: number): Promise<{data: any, ports: Array<number>}> {
    return browser.executeAsyncScript(function() {
      const callback = arguments[arguments.length - 1];
      const __ports = window['__ports'];
      const portId = arguments[0];
      __ports[portId].onmessage = function(e) {
        callback({data: e.data, ports: e.ports.map(port=>__ports.push(port)-1)});
      };
    }, portId);
  }

  postMessageToPort(portId: number, msg: any) {
    browser.executeScript(function() {
      const portId = arguments[0];
      const msg = arguments[1];
      const __ports = window['__ports'];
      __ports[portId].postMessage(msg);
    }, portId, msg);
  }

  async createMessageChannel(): Promise<[number, number]> {
    return browser.executeScript(function() {
      const mc = new MessageChannel();
      const __ports = window['__ports'];
      return [__ports.push(mc.port1)-1, __ports.push(mc.port2)-1];
    });
  }

  async postMessage(msg: any, portIds: Array<number>) {
    await browser.executeScript(function() {
      const msg = arguments[0];
      const portIds = arguments[1];
      const __ports = window['__ports'];
      const ports = portIds.map(id=>__ports[id]);
      postMessage(msg, location.origin, ports);
    }, msg, portIds);
  }

  async navigateTo() {
    await browser.driver.sendChromiumCommand('Accessibility.enable', {});
    await browser.get(browser.baseUrl);
    await browser.driver.executeScript(function() {
      const __ports = window['__ports'] = [];
      const __msgs = window['__msgs'] = [];
      window.addEventListener('message', function(event) {
        const portRefs = event.ports.map(port=>__ports.push(port)-1);
        __msgs.push({data: event.data, ports: portRefs});
      });
    });
  }

  private diffs = []
  getDiffs() {
    return this.diffs.slice();
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
    if (tree.ignored) return '';
    const head = `${
      tree.role
    }${
      JSON.stringify(tree.props)
    }${
      JSON.stringify(tree.attrs)
    }`;
    const body = tree.children.map(child=>this.serializeTree(child, padding + 1)).join('');
    return `${
      `${'.'.repeat(padding)}${head}\n`
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
