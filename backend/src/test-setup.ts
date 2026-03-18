import { beforeEach } from "vitest";
import { resetDatabase } from "./test-helpers";

beforeEach(async () => {
  await resetDatabase();
});
