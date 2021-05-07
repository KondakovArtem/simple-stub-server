export class UniqPrefixGenerator {
  private prefixMap: {
    [prefix: string]: number;
  } = {};

  private ids: number[] = [];

  getMap() {
    return {
      prefixMap: this.prefixMap,
      ids: this.ids,
    };
  }

  setMap(map: any) {
    this.prefixMap = map.prefixMap || {};
    this.ids = map.ids || [];
  }

  get(prefix: string) {
    let uniq;
    while (!uniq || this.ids.includes(uniq)) {
      this.prefixMap[prefix] = this.prefixMap[prefix] ? this.prefixMap[prefix] + 1 : 1;
      uniq = this.prefixMap[prefix];
    }
    this.ids.push(uniq);
    return uniq;
  }
}
