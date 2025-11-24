import formidable, { Fields, Files } from "formidable";
import type { NextApiRequest } from "next";

export function parseForm(
  req: NextApiRequest
): Promise<[Fields, Files]> {
  const form = formidable({});

  return new Promise<[Fields, Files]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });
}