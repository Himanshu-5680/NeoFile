export interface DroppedFile {
  file: File;
  rel: string;
}

function fileOf(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function readAll(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const next = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) resolve(all);
        else {
          all.push(...batch);
          next();
        }
      }, reject);
    };
    next();
  });
}

async function walk(entry: FileSystemEntry, prefix: string, out: DroppedFile[]) {
  const rel = `${prefix}${entry.name}`;
  if (entry.isFile) {
    out.push({ file: await fileOf(entry as FileSystemFileEntry), rel });
    return;
  }
  const children = await readAll((entry as FileSystemDirectoryEntry).createReader());
  for (const child of children) await walk(child, `${rel}/`, out);
}

export async function filesFromDataTransfer(transfer: DataTransfer): Promise<DroppedFile[]> {
  const out: DroppedFile[] = [];
  const items = [...transfer.items];
  let usedEntries = false;
  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (!entry) continue;
    usedEntries = true;
    await walk(entry, "", out);
  }
  if (!usedEntries) {
    for (const file of transfer.files) {
      out.push({ file, rel: file.webkitRelativePath || file.name });
    }
  }
  return out;
}
