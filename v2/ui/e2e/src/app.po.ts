import { browser, by, element } from 'protractor';

/*
 * Titus van Rijn was the fourth and only surviving child of Rembrandt.
 */
function Titus(node) {
  if (node) {
      let attrs = [];
      for(var key in node) {
          if (['string', 'boolean'].includes(typeof node[key])) {
              if (node[key] && key != "role" && (key != "checked" && node[key] != "none")) {
                  attrs.push(key+(node[key].length?'='+node[key]:''));
              }
          }
      }
      let children = [];
      for(let child = node.firstChild; child; child = child.nextSibling) {
          children.push(Titus(child));
      }
      return {role: node.role, attrs, children};
  }
}

export class AppPage {
  navigateTo() {
    return browser.get(browser.baseUrl) as Promise<any>;
  }

  takeSnapshot() {
    return browser.executeScript(`${Titus}; return Titus(await getComputedAccessibleNode(document.body))`) as Promise<string>;
  }
}
