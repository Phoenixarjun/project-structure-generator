import test from "node:test";
import assert from "node:assert/strict";
import { interpolate, transformValue } from "../src/engine/interpolate.js";

void test("interpolates known variables", () => {
  assert.equal(
    interpolate("src/{{packageName}}/{{projectName}}", { packageName: "billing", projectName: "billing-api" }),
    "src/billing/billing-api"
  );
});

void test("applies naming transforms", () => {
  assert.equal(transformValue("Billing Runtime", "kebab"), "billing-runtime");
  assert.equal(transformValue("Billing Runtime", "snake"), "billing_runtime");
  assert.equal(transformValue("Billing Runtime", "pascal"), "BillingRuntime");
  assert.equal(transformValue("Com.Example.Billing API", "java-package"), "com.example.billingapi");
  assert.equal(transformValue("com.example.billing", "java-path"), "com/example/billing");
});
