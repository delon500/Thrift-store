import pool from "../config/db.js";
import { parsePagination } from "../lib/adminRules.js";
import { markOrderPaid } from "./paymentController.js";

const PAYMENT_SELECT = `
  SELECT
    p.id, p.provider, p.provider_payment_id, p.payment_method, p.status,
    p.amount::text AS amount, p.currency, p.paid_at, p.failed_at,
    p.failure_reason, p.refunded_at, p.refund_reason, p.created_at,
    co.order_reference, co.user_full_name, co.user_email,
    co.status AS order_status, i.institution_name
  FROM payments p
  JOIN collection_orders co ON co.id = p.collection_order_id
  JOIN institutions i ON i.id = co.institution_id
`;

// GET /api/admin/payments?status=&q=&from=&to=&limit=&offset=
const listPayments = async (req, res) => {
  try {
    const conditions = [];
    const values = [];

    if (req.query.status) {
      values.push(req.query.status);
      conditions.push(`p.status = $${values.length}`);
    }
    if (req.query.q) {
      values.push(`%${req.query.q}%`);
      conditions.push(
        `(co.order_reference ILIKE $${values.length} OR p.provider_payment_id ILIKE $${values.length} OR co.user_email ILIKE $${values.length})`,
      );
    }
    if (req.query.from) {
      values.push(req.query.from);
      conditions.push(`p.created_at >= $${values.length}`);
    }
    if (req.query.to) {
      values.push(req.query.to);
      conditions.push(`p.created_at <= $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const scoped = `FROM payments p JOIN collection_orders co ON co.id = p.collection_order_id ${where}`;

    const totalResult = await pool.query(
      `SELECT count(*)::int AS total ${scoped}`,
      values,
    );
    const summaryResult = await pool.query(
      `SELECT
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'paid'), 0)::numeric(12,2)::text AS total_paid,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'refunded'), 0)::numeric(12,2)::text AS total_refunded,
        count(*) FILTER (WHERE p.status = 'failed')::int AS failed_count,
        count(*) FILTER (WHERE p.status = 'pending')::int AS pending_count
       ${scoped}`,
      values,
    );

    const listValues = [...values];
    let listQuery = `${PAYMENT_SELECT} ${where} ORDER BY p.created_at DESC`;
    const { limit, offset } = parsePagination(req.query);
    if (limit) {
      listValues.push(limit);
      listQuery += ` LIMIT $${listValues.length}`;
      listValues.push(offset);
      listQuery += ` OFFSET $${listValues.length}`;
    }

    const result = await pool.query(listQuery, listValues);
    return res.json({
      payments: result.rows,
      total: totalResult.rows[0].total,
      summary: summaryResult.rows[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load payments", error: error.message });
  }
};

// GET /api/admin/payments/:id — full record incl. raw provider payload.
const getPayment = async (req, res) => {
  try {
    const result = await pool.query(`${PAYMENT_SELECT} WHERE p.id = $1`, [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const extra = await pool.query(
      "SELECT raw_webhook_payload, refunded_by FROM payments WHERE id = $1",
      [req.params.id],
    );

    return res.json({
      payment: {
        ...result.rows[0],
        raw_webhook_payload: extra.rows[0].raw_webhook_payload,
        refunded_by: extra.rows[0].refunded_by,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load payment", error: error.message });
  }
};

// POST /api/admin/payments/:orderReference/recover — super-admin only.
// Marks a genuinely-paid-but-stuck order as paid (e.g. the ITN never arrived).
// markOrderPaid has an idempotency guard, so this is a no-op if already paid.
const recoverPayment = async (req, res) => {
  try {
    const order = await markOrderPaid({
      orderReference: req.params.orderReference,
      providerPaymentId: req.body?.provider_payment_id || "manual-recovery",
      rawPayload: {
        recovered: true,
        recovered_by: req.user.id,
        reason: "manual admin recovery — ITN not received",
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({
      message: "Order marked paid (recovered)",
      order_reference: order.order_reference,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to recover payment", error: error.message });
  }
};

export { getPayment, listPayments, recoverPayment };
