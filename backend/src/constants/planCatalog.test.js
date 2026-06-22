import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSubscriptionAmount } from "./planCatalog.js";

describe("planCatalog", () => {
  it("resolveSubscriptionAmount starter monthly", () => {
    assert.equal(resolveSubscriptionAmount("starterPro", "monthly"), 99000);
    assert.equal(resolveSubscriptionAmount("starter_pro", "monthly"), 99000);
  });

  it("resolveSubscriptionAmount starter yearly", () => {
    assert.equal(resolveSubscriptionAmount("starterPro", "yearly"), 1188000);
  });

  it("resolveSubscriptionAmount elite yearly", () => {
    assert.equal(resolveSubscriptionAmount("elite_pro", "yearly"), 2388000);
  });

  it("resolveSubscriptionAmount elite monthly", () => {
    assert.equal(resolveSubscriptionAmount("elite_pro", "monthly"), 199000);
  });

  it("resolveSubscriptionAmount invalid plan", () => {
    assert.equal(resolveSubscriptionAmount("free", "monthly"), null);
    assert.equal(resolveSubscriptionAmount("bogus", "monthly"), null);
  });
});
