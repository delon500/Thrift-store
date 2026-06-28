import pool from "../config/db.js";

// Tags can be looked up by their token (from the QR URL) or their human code
// (TAG-..., typed manually). Returns the row or null.
const findTag = async (value) => {
  const r = await pool.query(
    `SELECT t.id, t.token, t.code, t.status, t.label, t.owner_user_id,
            t.owner_child_id, t.institution_id, i.institution_name
     FROM item_tags t
     JOIN institutions i ON i.id = t.institution_id
     WHERE t.token = $1 OR t.code = $1`,
    [value],
  );
  return r.rows[0] || null;
};

// GET /api/tags/lookup/:value — resolve a tag (by token or code) and tell the
// caller whether they can activate it.
const lookupTag = async (req, res) => {
  try {
    const tag = await findTag(req.params.value);
    if (!tag) return res.status(404).json({ message: "Sticker not found" });

    const sameInstitution = tag.institution_id === req.user.institution_id;
    // Don't reveal anything about stickers issued by a different institution.
    if (!sameInstitution) {
      return res.json({ sameInstitution: false, claimable: false });
    }

    const ownedByMe = tag.owner_user_id === req.user.id;
    const claimable = tag.status === "unactivated";
    return res.json({
      tag: {
        code: tag.code,
        status: tag.status,
        institution_name: tag.institution_name,
        // Only reveal the label for a claimable sticker or one that's already
        // yours — never another person's active sticker. Never expose the token.
        label: claimable || ownedByMe ? tag.label : null,
      },
      sameInstitution: true,
      ownedByMe,
      claimable,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lookup failed", error: error.message });
  }
};

// POST /api/tags/activate — body { value (token|code), owner ('self'|childId), label }
const activateTag = async (req, res) => {
  try {
    const { value, owner, label } = req.body;
    if (!value) return res.status(400).json({ message: "A sticker code is required" });

    const tag = await findTag(value);
    if (!tag) return res.status(404).json({ message: "Sticker not found" });
    if (tag.status !== "unactivated") {
      return res.status(409).json({ message: "This sticker is already activated" });
    }
    if (tag.institution_id !== req.user.institution_id) {
      return res
        .status(403)
        .json({ message: "This sticker belongs to a different school" });
    }

    let ownerUserId = null;
    let ownerChildId = null;
    if (!owner || owner === "self") {
      ownerUserId = req.user.id;
    } else {
      const child = await pool.query(
        "SELECT id FROM child_profiles WHERE id = $1 AND guardian_user_id = $2",
        [owner, req.user.id],
      );
      if (child.rows.length === 0) {
        return res.status(400).json({ message: "That child isn't on your account" });
      }
      ownerChildId = owner;
    }

    const updated = await pool.query(
      `UPDATE item_tags
       SET status = 'active', owner_user_id = $1, owner_child_id = $2,
           label = $3, activated_at = now()
       WHERE id = $4
       RETURNING code, token, label, status`,
      [ownerUserId, ownerChildId, label ? String(label).trim() : null, tag.id],
    );
    return res.status(200).json({ tag: updated.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Activation failed", error: error.message });
  }
};

// GET /api/tags/mine — the caller's activated tags (theirs directly, or on one
// of their child profiles).
const myTags = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT t.token, t.code, t.label, t.status, t.activated_at,
              CASE WHEN t.owner_user_id = $1 THEN 'You'
                   ELSE cp.full_name END AS assignee
       FROM item_tags t
       LEFT JOIN child_profiles cp ON cp.id = t.owner_child_id
       WHERE t.status <> 'unactivated'
         AND (t.owner_user_id = $1 OR cp.guardian_user_id = $1)
       ORDER BY t.activated_at DESC NULLS LAST`,
      [req.user.id],
    );
    return res.json({ tags: r.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load your stickers", error: error.message });
  }
};

// POST /api/tags/:token/deactivate — unbind a tag the caller owns, freeing it.
const deactivateTag = async (req, res) => {
  try {
    const owned = await pool.query(
      `SELECT id FROM item_tags
       WHERE token = $1
         AND (owner_user_id = $2
              OR owner_child_id IN (
                SELECT id FROM child_profiles WHERE guardian_user_id = $2
              ))`,
      [req.params.token, req.user.id],
    );
    if (owned.rows.length === 0) {
      return res.status(404).json({ message: "Sticker not found or not yours" });
    }
    await pool.query(
      `UPDATE item_tags
       SET status = 'unactivated', owner_user_id = NULL, owner_child_id = NULL,
           label = NULL, activated_at = NULL
       WHERE id = $1`,
      [owned.rows[0].id],
    );
    return res.json({ message: "Sticker deactivated" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to deactivate", error: error.message });
  }
};

export { lookupTag, activateTag, myTags, deactivateTag };
