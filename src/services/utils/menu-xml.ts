import cheerio from 'cheerio';
import {resolve, isAbsolute} from 'path';
import fs from 'fs-extra';

export async function convertDataFromMenu(
  paths: {
    path: string;
    project: string;
  }[],
  folder?: string,
) {
  const res: any[] = [];

  for (const pathData of paths) {
    const {path, project} = pathData;
    const absPath = isAbsolute(path) ? path : resolve(folder || '', path);
    if (!fs.existsSync(absPath)) {
      console.log(`Can't find resource by path ${absPath}`);
      continue;
    }
    const content = await fs.readFile(absPath, 'utf8');
    const $ = cheerio.load(content, {
      lowerCaseTags: true,
      xml: true,
    });

    const parseMenu = (elements: ReturnType<typeof cheerio>) => {
      const items: any[] = [];
      elements.each((idx, itemNode) => {
        const item: any = {
          project,
          projectName: project,
        };
        $(itemNode)
          .children()
          .each((idx, itemProp) => {
            if (itemProp.type === 'tag') {
              const {name} = itemProp;
              if (name === 'Items') {
                item['items'] = parseMenu($(itemProp).children());
              } else {
                const convert = convertMap[name] || ((i: any) => i.text());
                item[propMap[name] || name] = convert($(itemProp));
              }
            }
          });
        items.push(item);
      });
      return items;
    };

    const propMap: {[index: string]: string} = {
      ItemCaption: 'caption',
      ItemAction: 'action',
      ItemDescription: 'description',
      ItemExpanded: 'expanded',
      ItemIconData: 'icon',
      ItemOpenMulti: 'openMulti',
      ItemOpenNewPage: 'openNewPage',
      ItemSysname: 'sysname',
      ItemActionParams: 'actionParams',
    };
    const convertMap: {[index: string]: (el: ReturnType<typeof cheerio>) => any} = {
      ItemExpanded: (el) => {
        return el.text() === '1';
      },
      ItemOpenMulti: (el) => {
        return el.text() === '1';
      },
      ItemOpenNewPage: (el) => {
        return el.text() === '1';
      },
    };

    res.push(...parseMenu($('Menu>Items>Item')));
  }
  return res;
}
