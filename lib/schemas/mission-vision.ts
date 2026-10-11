import { z } from "zod";
import { docMeta, iconName, lstr, seo } from "./common";

const codedText = z.object({
  code: z.string().trim().regex(/^[A-Z]{2,3}\d{1,2}$/, "Code like UM1 or PM2"),
  text: lstr,
});

export const missionItem = codedText.extend({
  title: lstr,
  icon: iconName.optional(),
});

export const objectiveItem = z.object({
  title: lstr,
  text: lstr,
});

/** Firestore `pages/missionVision` */
export const missionVisionSchema = z
  .object({
    universityVision: lstr,
    universityMission: z.array(codedText).default([]),
    deptVision: lstr,
    deptMission: z.array(missionItem).default([]),
    objectives: z.array(objectiveItem).default([]),
    seo,
  })
  .extend(docMeta.shape);

export type MissionVision = z.infer<typeof missionVisionSchema>;
