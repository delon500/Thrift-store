import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUserProfile,
  getEditableProfileFields,
  validatePasswordChange,
} from "./userController.js";

test("buildUserProfile combines user and institution fields without password_hash", () => {
  const profile = buildUserProfile({
    id: "user-1",
    role: "student",
    full_name: "Jane Student",
    email: "jane@example.com",
    contact_number: "123456789",
    password_hash: "secret-hash",
    institution_id: "institution-1",
    status: "approved",
    created_at: "2026-06-10",
    institution_name: "North High",
    institution_category: "school",
    institution_type: "public",
    institution_status: "approved",
  });

  assert.deepEqual(profile, {
    id: "user-1",
    role: "student",
    full_name: "Jane Student",
    email: "jane@example.com",
    contact_number: "123456789",
    institution_id: "institution-1",
    status: "approved",
    created_at: "2026-06-10",
    institution_name: "North High",
    institution_category: "school",
    institution_type: "public",
    institution_status: "approved",
  });
});

test("getEditableProfileFields only allows full_name and contact_number", () => {
  const fields = getEditableProfileFields({
    full_name: "Jane Updated",
    contact_number: "987654321",
    email: "new@example.com",
    role: "admin",
    status: "approved",
  });

  assert.deepEqual(fields, {
    full_name: "Jane Updated",
    contact_number: "987654321",
  });
});

test("validatePasswordChange rejects missing or mismatched password fields", () => {
  assert.equal(
    validatePasswordChange({ current_password: "", new_password: "secret123" }),
    "Current password and new password are required",
  );
  assert.equal(
    validatePasswordChange({
      current_password: "old-secret",
      new_password: "secret123",
      confirm_password: "different",
    }),
    "New passwords do not match",
  );
});
