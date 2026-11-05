export interface SampleFile {
  name: string;
  text: string;
  blurb: string;
}

export const SAMPLES: SampleFile[] = [
  {
    name: "Welcome.md",
    blurb: "What this desk will and will not edit",
    text: `# NeoFile

Local files only. There is no account, no sync, and no network call.

## You can edit

- Text and code: Markdown, HTML, CSS, Java, JavaScript, TypeScript, Python, JSON, XML, and plain text
- CSV and TSV, including quoted commas
- Spreadsheet **values** in xlsx, xls, and xlsm

## You can view

- PDF (select and search text)
- Word (.docx) as an HTML preview plus extracted text
- PowerPoint as slide text and embedded pictures
- Images, audio, and video

Saving a Word or PowerPoint file exports the original. It does not become a Word processor.

## Snapshots

Edits autosave into a local snapshot on this device. That copy is not the file on disk until you press Save.
`,
  },
  {
    name: "budget.csv",
    blurb: "A real CSV grid, quotes included",
    text: `month,category,note,amount
January,Rent,"Due on the 1st, no exceptions",1480
January,Food,"Market, coffee, ""the usual""",286.40
February,Rent,"Due on the 1st, no exceptions",1480
February,Tools,Offline apps only,0
March,Rent,"Due on the 1st
plus a late note",1480
`,
  },
  {
    name: "hello.py",
    blurb: "Python with syntax colors",
    text: `def greet(name: str) -> str:
    message = f"Hello, {name}. This file never left the device."
    return message


if __name__ == "__main__":
    print(greet("NeoFile"))
`,
  },
  {
    name: "Main.java",
    blurb: "A short Java source file",
    text: `public class Main {
    public static void main(String[] args) {
        String status = "offline";
        System.out.println("NeoFile desk is " + status);
    }
}
`,
  },
  {
    name: "notes.json",
    blurb: "JSON you can edit and save",
    text: `{
  "app": "NeoFile",
  "network": false,
  "formats": {
    "edit": ["text", "csv"],
    "values": ["xlsx"],
    "view": ["pdf", "docx", "pptx", "image", "audio", "video"]
  }
}
`,
  },
];
