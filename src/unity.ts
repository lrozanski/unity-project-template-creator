import {UnityExtractClient} from "unity-package-extract";
import {basename} from "path";
import {camelCase} from "lodash";
import {mkdtempSync} from "fs";
import rimraf from "rimraf";
import {Spinner} from "clui";

const client = new UnityExtractClient();
const tempDirPrefix = "unity-project-template-creator-asset-";

export function extractAssets(paths: string[]): Promise<string[]> {
    const promises = paths.map(async (path: string): Promise<string> => {
        const filename = basename(path);
        const dir = camelCase(basename(path, ".unitypackage"));
        console.log(dir, filename);

        const tempDirFinal = mkdtempSync(`${tempDirPrefix}${dir}-`, {encoding: "utf-8"})
        const tempDirExtracted = mkdtempSync(`${tempDirPrefix}${dir}-pre-`, {encoding: "utf-8"})

        const spinner = new Spinner(`[${filename}] Extracting`, ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷']);
        spinner.start();
        const dest = await client.extract(path, tempDirExtracted);
        spinner.stop();
        spinner.message(`[${filename}] Converting`);
        spinner.start();
        const converted = await client.convert(dest, tempDirFinal);
        spinner.stop();
        spinner.message(`[${filename}] Extracted ${converted.length} files to ${tempDirFinal}\n`);

        rimraf(tempDirExtracted, error => error && console.log(`Could not delete directory ${tempDirExtracted}/: ${error.message || ""}`));
        return tempDirFinal;
    });

    return Promise.all(promises);
}
