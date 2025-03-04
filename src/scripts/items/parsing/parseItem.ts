import { parseSimple } from "./parseSimple";
import { binaryStream } from "../../save-file/binary";
import { parseQuality } from "./parseQuality";
import { parseQuantified } from "./parseQuantified";
import { parseModifiers } from "./parseModifiers";
import { SaveFileReader } from "../../save-file/SaveFileReader";
import { LAST_LEGACY } from "../../character/parsing/versions";
import { ItemsOwner } from "../../save-file/ownership";

export function parseItem(reader: SaveFileReader, owner: ItemsOwner) {
  // https://squeek502.github.io/d2itemreader/formats/d2.html
  const stream = binaryStream(reader);

  if (owner.version <= LAST_LEGACY) {
    // This is awkward, but we're juggling between the regular reader and the binary stream
    // In this case, we want to read with the binary stream to make sure the header is included
    // in the raw binary of the item.
    const header = String.fromCharCode(stream.readInt(8), stream.readInt(8));
    if (header !== "JM") {
      throw new Error(`Unexpected header ${header} for an item`);
    }
  }
  const item = parseSimple(stream, owner);
  if (item.isStack && !item.simple) {
    parseQuantified(stream, item);
    // if(WATCH){
    // console.log(`item.code=%s, @@@ : `, item.code, item);
    // }

    // const charCode: number =
    stream.readInt(8 * 8);
    // console.log(charCode);
    // stream.readInt(8 * 8);
    // console.log(charCode);
    // while (charCode  != 255 ) {
    //   charCode = stream.readInt(8);
    //   console.log(charCode);
    // }
  }
  if (!item.isStack && !item.simple) {
    // If the id is cut short, it means it contained a "JM" which was identified as a boundary
    try {
      parseQuality(stream, item);
      parseQuantified(stream, item);
      parseModifiers(stream, item);
    } catch (e) {
      if (typeof e === "string") {
        console.error(e.toUpperCase()); // works, `e` narrowed to string
      } else if (e instanceof Error) {
        console.error(e.stack);
        console.error(e.message); // works, `e` narrowed to Error
      }
      console.log(`@@@ couldn't parse item: `, item);
    }
  }

  item.raw = stream.done();
  return item;
}
