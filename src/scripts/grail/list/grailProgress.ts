import { Set, SET_ITEMS, UniqueSetItem } from "../../../game-data";
import { Item } from "../../items/types/Item";
import { getGrailItem } from "./getGrailItem";
import { UniqueSection } from "./uniquesOrder";
import { listGrailUniques } from "./listGrailUniques";
import { groupBySet } from "./groupSets";
import { canBeEthereal } from "./canBeEthereal";

export interface GrailStatus {
  item: UniqueSetItem;
  normal: boolean;
  // Undefined means not applicable
  ethereal?: boolean;
  perfect: boolean;
}

function addToGrail(found: Map<UniqueSetItem, Item[]>, item: Item) {
  const grailItem = getGrailItem(item);
  if (grailItem) {
    let existing = found.get(grailItem);
    if (!existing) {
      existing = [];
      found.set(grailItem, existing);
    }
    existing.push(item);
  }
}

export function grailProgress(items: Item[]) {
  const found = new Map<UniqueSetItem, Item[]>();

  for (const item of items) {
    addToGrail(found, item);
    if (item.filledSockets) {
      for (const socketed of item.filledSockets) {
        addToGrail(found, socketed);
      }
    }
  }

  const progress = new Map<UniqueSection | Set, GrailStatus[][]>();

  for (const [section, uniques] of listGrailUniques()) {
    progress.set(
      section,
      uniques.map((tier) =>
        tier.map((item) => {
          return {
            item: item || tier,
            normal: !!found.get(item),
            ethereal: canBeEthereal(item)
              ? !!found.get(item)?.some(({ ethereal }) => ethereal)
              : undefined,
            perfect: !!found
              .get(item)
              ?.some(({ perfectionScore }) => perfectionScore === 100),
          };
        })
      )
    );
  }

  for (const [set, setItems] of groupBySet(SET_ITEMS)) {
    progress.set(set, [
      setItems.map((item) => ({
        item,
        normal: !!found.get(item),
        ethereal: undefined,
        perfect: !!found
          .get(item)
          ?.some(({ perfectionScore }) => perfectionScore === 100),
      })),
    ]);
  }

  return progress;
}

export function grailSummary(items: Item[]) {
  const summary = {
    nbNormal: 0,
    totalNormal: 0,
    nbEth: 0,
    totalEth: 0,
    nbPerfect: 0,
    owners: [],
  };
  for (const tiers of grailProgress(items).values()) {
    for (const tier of tiers) {
      for (const { normal, ethereal, perfect } of tier) {
        summary.totalNormal++;
        if (normal) {
          summary.nbNormal++;
        }
        if (perfect) {
          summary.nbPerfect++;
        }
        if (typeof ethereal !== "undefined") {
          summary.totalEth++;
          if (ethereal) {
            summary.nbEth++;
          }
        }
      }
    }
  }
  return summary;
}

export function printGrailProgress(items: Item[]) {
  for (const [section, tiers] of grailProgress(items)) {
    console.log(`\x1b[35m${section.name}\x1b[39m`);
    for (const tier of tiers) {
      for (const { item, normal, ethereal, perfect } of tier) {
        let line = item.name;
        line += normal
          ? ` \x1b[32mnormal ✔\x1b[39m`
          : ` \x1b[31mnormal ✘\x1b[39m`;
        if (typeof ethereal !== "undefined") {
          line += ethereal
            ? ` \x1b[32meth ✔\x1b[39m`
            : ` \x1b[31meth ✘\x1b[39m`;
        }
        line += perfect
          ? ` \x1b[32mperfect ✔\x1b[39m`
          : ` \x1b[31mperfect ✘\x1b[39m`;
        console.log(line);
      }
      console.log("");
    }
  }
}
