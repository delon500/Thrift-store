--
-- PostgreSQL database dump
--

\restrict 1E8ecdpLdjChD7tcviLbdY6yMdIC89Hu0ysMdqyB92Z7MJ1Z9SSQbr8yCO2RHUZ

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: approval_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.approval_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'suspended'
);


--
-- Name: cart_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cart_status AS ENUM (
    'active',
    'checked_out',
    'abandoned'
);


--
-- Name: collection_order_item_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.collection_order_item_status AS ENUM (
    'reserved',
    'collected',
    'cancelled',
    'expired'
);


--
-- Name: collection_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.collection_order_status AS ENUM (
    'confirmed',
    'collected',
    'cancelled',
    'expired',
    'payment_pending',
    'paid',
    'ready_for_collection',
    'payment_failed'
);


--
-- Name: institution_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.institution_type AS ENUM (
    'public',
    'private',
    'independent'
);


--
-- Name: listing_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.listing_type AS ENUM (
    'Thrift Store',
    'Lost and Found'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'cancelled',
    'refunded'
);


--
-- Name: product_gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_gender AS ENUM (
    'Male',
    'Female',
    'Unisex'
);


--
-- Name: product_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_status AS ENUM (
    'Available',
    'Sold',
    'Pending',
    'Reserved',
    'Claimed',
    'Cancelled'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'student',
    'parent',
    'school',
    'university',
    'admin',
    'super_admin'
);


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    action character varying(60) NOT NULL,
    actor_id uuid,
    actor_role character varying(30),
    actor_name character varying(255),
    institution_id uuid,
    entity_type character varying(40),
    entity_id character varying(100),
    entity_ref character varying(100),
    description text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT cart_items_quantity_check CHECK ((quantity = 1))
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    status public.cart_status DEFAULT 'active'::public.cart_status NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: child_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.child_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    guardian_user_id uuid NOT NULL,
    full_name character varying(120) NOT NULL,
    grade character varying(40),
    institution_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: collection_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection_order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    collection_order_id uuid NOT NULL,
    product_id uuid,
    product_reference_number character varying(50) NOT NULL,
    listing_type public.listing_type NOT NULL,
    product_name character varying(255) NOT NULL,
    institution_name character varying(255) NOT NULL,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    item_status public.collection_order_item_status DEFAULT 'reserved'::public.collection_order_item_status NOT NULL,
    collected_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT collection_order_items_quantity_check CHECK ((quantity = 1))
);


--
-- Name: COLUMN collection_order_items.product_reference_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.collection_order_items.product_reference_number IS 'Snapshot of the item reference number used by the school to verify collection.';


--
-- Name: COLUMN collection_order_items.listing_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.collection_order_items.listing_type IS 'Snapshot of whether the collected item came from Thrift Store or Lost and Found.';


--
-- Name: collection_order_reference_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.collection_order_reference_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: collection_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_reference character varying(50) DEFAULT ((('ORD-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || lpad((nextval('public.collection_order_reference_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
    user_id uuid NOT NULL,
    institution_id uuid NOT NULL,
    status public.collection_order_status DEFAULT 'confirmed'::public.collection_order_status NOT NULL,
    user_full_name character varying(255) NOT NULL,
    user_email character varying(255) NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    service_fee numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    collection_note text,
    email_sent_at timestamp without time zone,
    expires_at timestamp without time zone,
    collected_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE collection_orders; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.collection_orders IS 'Confirmed user collection records for thrift store purchases and lost-and-found claims.';


--
-- Name: COLUMN collection_orders.order_reference; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.collection_orders.order_reference IS 'Order-level reference for the user collection transaction.';


--
-- Name: found_report_reference_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.found_report_reference_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: found_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.found_reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reference character varying(50) DEFAULT ((('LF-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || lpad((nextval('public.found_report_reference_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
    tag_id uuid NOT NULL,
    institution_id uuid NOT NULL,
    found_by_user_id uuid,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    found_at timestamp without time zone DEFAULT now() NOT NULL,
    returned_at timestamp without time zone,
    product_id uuid,
    CONSTRAINT found_reports_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'returned'::character varying, 'resold'::character varying])::text[])))
);


--
-- Name: guardianship; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardianship (
    guardian_user_id uuid NOT NULL,
    student_user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: institution_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institution_settings (
    institution_id uuid NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    updated_by uuid
);


--
-- Name: institutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institutions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    institution_name character varying(255) NOT NULL,
    institution_type public.institution_type NOT NULL,
    registration_number character varying(100),
    contact_person_name character varying(255) NOT NULL,
    contact_email character varying(255) NOT NULL,
    contact_number character varying(50) NOT NULL,
    institution_phone character varying(50) NOT NULL,
    status public.approval_status DEFAULT 'pending'::public.approval_status NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    institution_category character varying(20) DEFAULT 'school'::character varying NOT NULL,
    CONSTRAINT institutions_category_check CHECK (((institution_category)::text = ANY (ARRAY[('school'::character varying)::text, ('university'::character varying)::text])))
);


--
-- Name: tag_reference_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tag_reference_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) DEFAULT ((('TAG-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || lpad((nextval('public.tag_reference_seq'::regclass))::text, 6, '0'::text)) NOT NULL,
    token character varying(32) NOT NULL,
    batch_id uuid NOT NULL,
    institution_id uuid NOT NULL,
    status character varying(20) DEFAULT 'unactivated'::character varying NOT NULL,
    owner_user_id uuid,
    owner_child_id uuid,
    label character varying(120),
    activated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT item_tags_status_check CHECK (((status)::text = ANY ((ARRAY['unactivated'::character varying, 'active'::character varying, 'reported_found'::character varying, 'returned'::character varying, 'retired'::character varying])::text[])))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    body text,
    entity_type character varying(40),
    entity_ref character varying(100),
    link character varying(255),
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    collection_order_id uuid NOT NULL,
    provider character varying(50) DEFAULT 'manual'::character varying NOT NULL,
    provider_payment_id character varying(150),
    payment_method character varying(80) NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'ZAR'::character varying NOT NULL,
    paid_at timestamp without time zone,
    failed_at timestamp without time zone,
    raw_webhook_payload jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    failure_reason text,
    refunded_at timestamp without time zone,
    refund_reason text,
    refunded_by uuid
);


--
-- Name: TABLE payments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payments IS 'Payment records linked to collection orders. Gateway webhooks update these records.';


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    image_url text NOT NULL,
    sort_order integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: product_reference_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_reference_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text DEFAULT ''::text,
    gender public.product_gender NOT NULL,
    price numeric(10,2) NOT NULL,
    status public.product_status DEFAULT 'Available'::public.product_status NOT NULL,
    category character varying(100) NOT NULL,
    institution_id uuid NOT NULL,
    age character varying(50) NOT NULL,
    condition character varying(50) NOT NULL,
    listing_type public.listing_type NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    reference_number character varying(50) DEFAULT ((('ITEM-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || lpad((nextval('public.product_reference_seq'::regclass))::text, 6, '0'::text)) NOT NULL
);


--
-- Name: COLUMN products.reference_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.products.reference_number IS 'Permanent item reference shown in-app and emailed to users for school collection.';


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    filename text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tag_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_batches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    institution_id uuid NOT NULL,
    quantity integer NOT NULL,
    note text,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT tag_batches_quantity_check CHECK (((quantity > 0) AND (quantity <= 1000)))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    role public.user_role NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    contact_number character varying(50) NOT NULL,
    password_hash text NOT NULL,
    institution_id uuid,
    status public.approval_status DEFAULT 'pending'::public.approval_status NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: cart_items cart_items_cart_product_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_product_key UNIQUE (cart_id, product_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: child_profiles child_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child_profiles
    ADD CONSTRAINT child_profiles_pkey PRIMARY KEY (id);


--
-- Name: collection_order_items collection_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_order_items
    ADD CONSTRAINT collection_order_items_pkey PRIMARY KEY (id);


--
-- Name: collection_orders collection_orders_order_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_orders
    ADD CONSTRAINT collection_orders_order_reference_key UNIQUE (order_reference);


--
-- Name: collection_orders collection_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_orders
    ADD CONSTRAINT collection_orders_pkey PRIMARY KEY (id);


--
-- Name: found_reports found_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.found_reports
    ADD CONSTRAINT found_reports_pkey PRIMARY KEY (id);


--
-- Name: guardianship guardianship_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardianship
    ADD CONSTRAINT guardianship_pkey PRIMARY KEY (guardian_user_id, student_user_id);


--
-- Name: institution_settings institution_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institution_settings
    ADD CONSTRAINT institution_settings_pkey PRIMARY KEY (institution_id, key);


--
-- Name: institutions institutions_contact_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_contact_email_key UNIQUE (contact_email);


--
-- Name: institutions institutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_pkey PRIMARY KEY (id);


--
-- Name: item_tags item_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_tags
    ADD CONSTRAINT item_tags_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (filename);


--
-- Name: tag_batches tag_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_batches
    ADD CONSTRAINT tag_batches_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activity_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_action_idx ON public.activity_logs USING btree (action);


--
-- Name: activity_logs_actor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_actor_idx ON public.activity_logs USING btree (actor_id);


--
-- Name: activity_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_created_at_idx ON public.activity_logs USING btree (created_at DESC);


--
-- Name: activity_logs_institution_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_institution_idx ON public.activity_logs USING btree (institution_id);


--
-- Name: cart_items_cart_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cart_items_cart_id_idx ON public.cart_items USING btree (cart_id);


--
-- Name: cart_items_product_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cart_items_product_id_idx ON public.cart_items USING btree (product_id);


--
-- Name: carts_one_active_cart_per_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX carts_one_active_cart_per_user_idx ON public.carts USING btree (user_id) WHERE (status = 'active'::public.cart_status);


--
-- Name: carts_user_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX carts_user_status_idx ON public.carts USING btree (user_id, status);


--
-- Name: child_profiles_guardian_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX child_profiles_guardian_idx ON public.child_profiles USING btree (guardian_user_id);


--
-- Name: collection_order_items_order_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_order_items_order_id_idx ON public.collection_order_items USING btree (collection_order_id);


--
-- Name: collection_order_items_product_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_order_items_product_id_idx ON public.collection_order_items USING btree (product_id);


--
-- Name: collection_order_items_reference_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_order_items_reference_status_idx ON public.collection_order_items USING btree (product_reference_number, item_status);


--
-- Name: collection_orders_institution_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_orders_institution_status_idx ON public.collection_orders USING btree (institution_id, status);


--
-- Name: collection_orders_reference_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_orders_reference_idx ON public.collection_orders USING btree (order_reference);


--
-- Name: collection_orders_user_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX collection_orders_user_status_idx ON public.collection_orders USING btree (user_id, status);


--
-- Name: found_reports_inst_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX found_reports_inst_status_idx ON public.found_reports USING btree (institution_id, status);


--
-- Name: found_reports_reference_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX found_reports_reference_idx ON public.found_reports USING btree (reference);


--
-- Name: guardianship_student_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX guardianship_student_idx ON public.guardianship USING btree (student_user_id);


--
-- Name: item_tags_batch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX item_tags_batch_idx ON public.item_tags USING btree (batch_id);


--
-- Name: item_tags_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX item_tags_code_idx ON public.item_tags USING btree (code);


--
-- Name: item_tags_inst_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX item_tags_inst_status_idx ON public.item_tags USING btree (institution_id, status);


--
-- Name: item_tags_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX item_tags_token_idx ON public.item_tags USING btree (token);


--
-- Name: notifications_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_created_idx ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: notifications_user_unread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_unread_idx ON public.notifications USING btree (user_id) WHERE (read_at IS NULL);


--
-- Name: payments_order_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_order_id_idx ON public.payments USING btree (collection_order_id);


--
-- Name: payments_provider_payment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_provider_payment_id_idx ON public.payments USING btree (provider_payment_id);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: products_listing_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_listing_type_idx ON public.products USING btree (listing_type);


--
-- Name: products_reference_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_reference_number_idx ON public.products USING btree (reference_number);


--
-- Name: products_reference_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX products_reference_status_idx ON public.products USING btree (reference_number, status);


--
-- Name: cart_items set_cart_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: carts set_carts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: collection_order_items set_collection_order_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_collection_order_items_updated_at BEFORE UPDATE ON public.collection_order_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: collection_orders set_collection_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_collection_orders_updated_at BEFORE UPDATE ON public.collection_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: payments set_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: products set_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: child_profiles child_profiles_guardian_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child_profiles
    ADD CONSTRAINT child_profiles_guardian_fkey FOREIGN KEY (guardian_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: child_profiles child_profiles_institution_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child_profiles
    ADD CONSTRAINT child_profiles_institution_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: collection_order_items collection_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_order_items
    ADD CONSTRAINT collection_order_items_order_id_fkey FOREIGN KEY (collection_order_id) REFERENCES public.collection_orders(id) ON DELETE CASCADE;


--
-- Name: collection_order_items collection_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_order_items
    ADD CONSTRAINT collection_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: collection_orders collection_orders_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_orders
    ADD CONSTRAINT collection_orders_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE RESTRICT;


--
-- Name: collection_orders collection_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_orders
    ADD CONSTRAINT collection_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: found_reports found_reports_found_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.found_reports
    ADD CONSTRAINT found_reports_found_by_user_id_fkey FOREIGN KEY (found_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: found_reports found_reports_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.found_reports
    ADD CONSTRAINT found_reports_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: found_reports found_reports_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.found_reports
    ADD CONSTRAINT found_reports_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: found_reports found_reports_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.found_reports
    ADD CONSTRAINT found_reports_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.item_tags(id) ON DELETE CASCADE;


--
-- Name: guardianship guardianship_guardian_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardianship
    ADD CONSTRAINT guardianship_guardian_fkey FOREIGN KEY (guardian_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: guardianship guardianship_student_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardianship
    ADD CONSTRAINT guardianship_student_fkey FOREIGN KEY (student_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: institution_settings institution_settings_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institution_settings
    ADD CONSTRAINT institution_settings_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: item_tags item_tags_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_tags
    ADD CONSTRAINT item_tags_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.tag_batches(id) ON DELETE CASCADE;


--
-- Name: item_tags item_tags_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_tags
    ADD CONSTRAINT item_tags_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: item_tags item_tags_owner_child_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_tags
    ADD CONSTRAINT item_tags_owner_child_fkey FOREIGN KEY (owner_child_id) REFERENCES public.child_profiles(id) ON DELETE SET NULL;


--
-- Name: item_tags item_tags_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_tags
    ADD CONSTRAINT item_tags_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_collection_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_collection_order_id_fkey FOREIGN KEY (collection_order_id) REFERENCES public.collection_orders(id) ON DELETE CASCADE;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: tag_batches tag_batches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_batches
    ADD CONSTRAINT tag_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tag_batches tag_batches_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_batches
    ADD CONSTRAINT tag_batches_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE CASCADE;


--
-- Name: users users_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_institution_id_fkey FOREIGN KEY (institution_id) REFERENCES public.institutions(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 1E8ecdpLdjChD7tcviLbdY6yMdIC89Hu0ysMdqyB92Z7MJ1Z9SSQbr8yCO2RHUZ

