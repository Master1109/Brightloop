import { MigrationInterface, QueryRunner } from 'typeorm';

const initialSchemaStatements = [
  "CREATE TYPE \"account_role\" AS ENUM('admin', 'staff', 'customer')",
  "CREATE TABLE \"accounts\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"email\" character varying NOT NULL, \"password_hash\" character varying NOT NULL, \"role\" \"account_role\" NOT NULL DEFAULT 'customer', \"is_active\" boolean DEFAULT true, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"UQ_ee66de6cdc53993296d1ceb8aa0\" UNIQUE (\"email\"), CONSTRAINT \"PK_5a7a02c20412299d198e097a8fe\" PRIMARY KEY (\"id\"))",
  "CREATE INDEX \"IDX_ee66de6cdc53993296d1ceb8aa\" ON \"accounts\" (\"email\") ",
  "CREATE TABLE \"staff_profiles\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"account_id\" uuid, \"full_name\" character varying, \"permissions\" jsonb DEFAULT [], \"created_by\" uuid, CONSTRAINT \"REL_8fb546ef5b5469cc05084e799b\" UNIQUE (\"account_id\"), CONSTRAINT \"PK_6d4c6c0b447e39147b4a6dcbede\" PRIMARY KEY (\"id\"))",
  "CREATE TABLE \"customer_profiles\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"account_id\" uuid, \"company_name\" character varying, \"billing_address\" text, \"created_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT \"REL_f2f1d91892f90749ac2a4e2caa\" UNIQUE (\"account_id\"), CONSTRAINT \"PK_ece08ee55cbe707d9f870907727\" PRIMARY KEY (\"id\"))",
  "CREATE TABLE \"products\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"name\" character varying NOT NULL, \"type\" character varying, \"sales_price_cents\" integer NOT NULL, \"cost_price_cents\" integer, \"notes\" text, \"is_active\" boolean DEFAULT true, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_0806c755e0aca124e67c0cf6d7d\" PRIMARY KEY (\"id\"))",
  "CREATE TABLE \"product_variants\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"product_id\" uuid, \"name\" character varying NOT NULL, \"price_adjustment_cents\" integer NOT NULL DEFAULT '0', \"is_active\" boolean DEFAULT true, CONSTRAINT \"PK_281e3f2c55652d6a22c0aa59fd7\" PRIMARY KEY (\"id\"))",
  "CREATE TYPE \"billing_freq\" AS ENUM('daily', 'weekly', 'monthly', 'yearly')",
  "CREATE TYPE \"term_behavior\" AS ENUM('auto_close', 'close_early', 'pause', 'renew')",
  "CREATE TABLE \"plans\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"name\" character varying NOT NULL, \"price_cents\" integer NOT NULL, \"billing_frequency\" \"billing_freq\" NOT NULL, \"min_quantity\" integer NOT NULL DEFAULT '1', \"available_from\" date, \"available_until\" date, \"end_of_term_behavior\" \"term_behavior\" NOT NULL, \"is_active\" boolean DEFAULT true, \"created_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT \"PK_3720521a81c7c24fe9b7202ba61\" PRIMARY KEY (\"id\"))",
  "CREATE TABLE \"quotation_templates\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"name\" character varying NOT NULL, \"plan_id\" uuid, \"validity_days\" integer NOT NULL, \"created_by\" uuid, \"created_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), \"expires_at\" TIMESTAMP WITH TIME ZONE, CONSTRAINT \"PK_d78560b9ab766f3019be00124a4\" PRIMARY KEY (\"id\"))",
  "CREATE TABLE \"quotation_template_lines\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"template_id\" uuid, \"product_id\" uuid, \"variant_id\" uuid, \"quantity\" integer NOT NULL, \"unit_price_cents\" integer NOT NULL, \"tax_rate\" numeric(5,4), CONSTRAINT \"PK_f238e8c65ab1d7c8c36de96bd72\" PRIMARY KEY (\"id\"))",
  "CREATE TYPE \"sub_status\" AS ENUM('draft', 'quotation', 'confirmed', 'active', 'closed')",
  "CREATE TABLE \"subscriptions\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"subscription_number\" character varying NOT NULL, \"customer_id\" uuid, \"plan_id\" uuid, \"start_date\" date NOT NULL, \"expiry_date\" date, \"payment_terms\" character varying, \"status\" \"sub_status\" NOT NULL DEFAULT 'draft', \"created_by\" uuid, \"created_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), \"updated_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT \"UQ_bd84bf59b99e5fd20b788e62d50\" UNIQUE (\"subscription_number\"), CONSTRAINT \"PK_a87248d73155605cf782be9ee5e\" PRIMARY KEY (\"id\"))",
  "CREATE INDEX \"IDX_55f1767e1e69cb91cb95ccbd5a\" ON \"subscriptions\" (\"expiry_date\") ",
  "CREATE INDEX \"IDX_e45fca5d912c3a2fab512ac25d\" ON \"subscriptions\" (\"plan_id\") ",
  "CREATE INDEX \"IDX_6ccf973355b70645eff37774de\" ON \"subscriptions\" (\"status\") ",
  "CREATE INDEX \"IDX_98a4e1e3025f768de1493ecede\" ON \"subscriptions\" (\"customer_id\") ",
  "CREATE TABLE \"subscription_lines\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"subscription_id\" uuid NOT NULL, \"product_id\" uuid, \"variant_id\" uuid, \"quantity\" integer NOT NULL, \"unit_price_cents\" integer NOT NULL, \"tax_rate\" numeric(5,4), \"tax_amount_cents\" integer, \"amount_cents\" integer NOT NULL, CONSTRAINT \"PK_78d296bd3f10f4a2abdd01d2faa\" PRIMARY KEY (\"id\"))",
  "CREATE TYPE \"tax_scope\" AS ENUM('all', 'specific_products')",
  "CREATE TABLE \"tax_rules\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"name\" character varying NOT NULL, \"rate\" numeric(5,4) NOT NULL, \"applicable_to\" \"tax_scope\" NOT NULL, \"is_active\" boolean DEFAULT true, \"created_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT \"PK_29b500604ee0ac9e162de1bfa6d\" PRIMARY KEY (\"id\"))",
  "CREATE TYPE \"disc_type\" AS ENUM('fixed', 'percentage')",
  "CREATE TYPE \"disc_scope\" AS ENUM('specific_products', 'whole_subscription')",
  "CREATE TABLE \"discounts\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"name\" character varying NOT NULL, \"type\" \"disc_type\" NOT NULL, \"value_cents\" integer, \"percentage\" numeric(5,4), \"min_purchase_cents\" integer DEFAULT '0', \"min_quantity\" integer DEFAULT '1', \"start_date\" date NOT NULL, \"end_date\" date, \"usage_limit\" integer, \"usage_count\" integer DEFAULT '0', \"scope\" \"disc_scope\" NOT NULL, \"is_active\" boolean DEFAULT true, \"created_by\" uuid, \"created_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT \"PK_66c522004212dc814d6e2f14ecc\" PRIMARY KEY (\"id\"))",
  "CREATE TYPE \"inv_status\" AS ENUM('draft', 'confirmed', 'paid')",
  "CREATE TABLE \"invoices\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"invoice_number\" character varying NOT NULL, \"subscription_id\" uuid, \"customer_id\" uuid, \"billing_period_start\" date, \"billing_period_end\" date, \"status\" \"inv_status\" NOT NULL DEFAULT 'draft', \"subtotal_cents\" integer NOT NULL, \"tax_total_cents\" integer NOT NULL, \"discount_total_cents\" integer DEFAULT '0', \"grand_total_cents\" integer NOT NULL, \"idempotency_key\" character varying, \"sent_at\" TIMESTAMP WITH TIME ZONE, \"paid_at\" TIMESTAMP WITH TIME ZONE, \"created_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT \"UQ_d8f8d3788694e1b3f96c42c36fb\" UNIQUE (\"invoice_number\"), CONSTRAINT \"UQ_2bc7ea1d26b4e2d220ba47d7d71\" UNIQUE (\"idempotency_key\"), CONSTRAINT \"PK_668cef7c22a427fd822cc1be3ce\" PRIMARY KEY (\"id\"))",
  "CREATE INDEX \"IDX_ac0f09364e3701d9ed35435288\" ON \"invoices\" (\"status\") ",
  "CREATE INDEX \"IDX_65e3145f317bd655481d3f96c7\" ON \"invoices\" (\"customer_id\") ",
  "CREATE INDEX \"IDX_5152c0aa0f851d9b95972b442e\" ON \"invoices\" (\"subscription_id\") ",
  "CREATE TABLE \"invoice_lines\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"invoice_id\" uuid, \"product_id\" uuid, \"description\" character varying, \"quantity\" integer NOT NULL, \"unit_price_cents\" integer NOT NULL, \"tax_rate\" numeric(5,4), \"tax_amount_cents\" integer, \"discount_applied_cents\" integer DEFAULT '0', \"amount_cents\" integer NOT NULL, CONSTRAINT \"PK_3d18eb48142b916f581f0c21a65\" PRIMARY KEY (\"id\"))",
  "CREATE TABLE \"payments\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"invoice_id\" uuid, \"method\" character varying NOT NULL, \"amount_cents\" integer NOT NULL, \"payment_date\" date NOT NULL, \"note\" text, \"recorded_by\" uuid, \"created_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT \"PK_197ab7af18c93fbb0c9b28b4a59\" PRIMARY KEY (\"id\"))",
  "CREATE INDEX \"IDX_563a5e248518c623eebd987d43\" ON \"payments\" (\"invoice_id\") ",
  "CREATE TABLE \"audit_logs\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"actor_id\" uuid, \"action\" character varying NOT NULL, \"entity_type\" character varying NOT NULL, \"entity_id\" uuid, \"before\" jsonb, \"after\" jsonb, \"created_at\" TIMESTAMP WITH TIME ZONE DEFAULT now(), CONSTRAINT \"PK_1bb179d048bbc581caa3b013439\" PRIMARY KEY (\"id\"))",
  "CREATE INDEX \"IDX_2cd10fda8276bb995288acfbfb\" ON \"audit_logs\" (\"created_at\") ",
  "CREATE INDEX \"IDX_7421efc125d95e413657efa3c6\" ON \"audit_logs\" (\"entity_type\", \"entity_id\") ",
  "ALTER TABLE \"staff_profiles\" ADD CONSTRAINT \"FK_8fb546ef5b5469cc05084e799b1\" FOREIGN KEY (\"account_id\") REFERENCES \"accounts\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION",
  "ALTER TABLE \"customer_profiles\" ADD CONSTRAINT \"FK_f2f1d91892f90749ac2a4e2caa5\" FOREIGN KEY (\"account_id\") REFERENCES \"accounts\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION",
  "ALTER TABLE \"product_variants\" ADD CONSTRAINT \"FK_6343513e20e2deab45edfce1316\" FOREIGN KEY (\"product_id\") REFERENCES \"products\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION",
  "ALTER TABLE \"quotation_templates\" ADD CONSTRAINT \"FK_ba9d1514a029aff858d75eb240e\" FOREIGN KEY (\"plan_id\") REFERENCES \"plans\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION",
  "ALTER TABLE \"quotation_template_lines\" ADD CONSTRAINT \"FK_3d1ca87ba9584e099fdbb59319e\" FOREIGN KEY (\"template_id\") REFERENCES \"quotation_templates\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION",
  "ALTER TABLE \"subscriptions\" ADD CONSTRAINT \"FK_e45fca5d912c3a2fab512ac25dc\" FOREIGN KEY (\"plan_id\") REFERENCES \"plans\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION",
  "ALTER TABLE \"subscription_lines\" ADD CONSTRAINT \"FK_378345f1d84ec8334e695389acf\" FOREIGN KEY (\"subscription_id\") REFERENCES \"subscriptions\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION",
  "ALTER TABLE \"invoices\" ADD CONSTRAINT \"FK_5152c0aa0f851d9b95972b442e0\" FOREIGN KEY (\"subscription_id\") REFERENCES \"subscriptions\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION",
  "ALTER TABLE \"invoice_lines\" ADD CONSTRAINT \"FK_2da95dc86a54a00ff20ce46d0fe\" FOREIGN KEY (\"invoice_id\") REFERENCES \"invoices\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION",
  "ALTER TABLE \"payments\" ADD CONSTRAINT \"FK_563a5e248518c623eebd987d43e\" FOREIGN KEY (\"invoice_id\") REFERENCES \"invoices\"(\"id\") ON DELETE NO ACTION ON UPDATE NO ACTION"
];
const managedTables = [
  "accounts",
  "staff_profiles",
  "customer_profiles",
  "products",
  "product_variants",
  "plans",
  "quotation_templates",
  "quotation_template_lines",
  "subscriptions",
  "subscription_lines",
  "tax_rules",
  "discounts",
  "invoices",
  "invoice_lines",
  "payments",
  "audit_logs"
];
const enumTypes = [
  "accounts_role_enum",
  "plans_billing_frequency_enum",
  "plans_end_of_term_behavior_enum",
  "subscriptions_status_enum",
  "tax_rules_applicable_to_enum",
  "discounts_type_enum",
  "discounts_scope_enum",
  "invoices_status_enum"
];
const ownershipTable = '__brightloop_initial_schema_owned';

export class InitialSchema1793444603207 implements MigrationInterface {
  name = 'InitialSchema1793444603207';

  async up(queryRunner: QueryRunner): Promise<void> {
    const entities = queryRunner.connection.entityMetadatas;
    const currentTables = await queryRunner.getTables();
    const migrationsTable = 'migrations';
    const currentByName = new Map(currentTables.map((table) => [table.name, table]));
    const existingEntities = entities.filter((entity) => currentByName.has(entity.tableName));
    const unrelatedTables = currentTables.filter(
      (table) =>
        !entities.some((entity) => entity.tableName === table.name) &&
        table.name !== migrationsTable &&
        table.name !== ownershipTable,
    );

    if (existingEntities.length === 0) {
      if (unrelatedTables.length > 0) {
        throw new Error(
          'Refusing to initialize Brightloop in a non-empty database with no matching entity tables.',
        );
      }

      await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      for (const statement of initialSchemaStatements) {
        await queryRunner.query(statement);
      }
      await queryRunner.query(
        'CREATE TABLE "__brightloop_initial_schema_owned" ("id" smallint PRIMARY KEY CHECK ("id" = 1))',
      );
      await queryRunner.query(
        'INSERT INTO "__brightloop_initial_schema_owned" ("id") VALUES (1)',
      );
      return;
    }

    const missingTables = entities
      .filter((entity) => !currentByName.has(entity.tableName))
      .map((entity) => entity.tableName);
    const missingColumns = entities.flatMap((entity) => {
      const table = currentByName.get(entity.tableName);
      if (!table) return [];
      return entity.columns
        .filter((column) => !table.columns.some((existing) => existing.name === column.databaseName))
        .map((column) => entity.tableName + '.' + column.databaseName);
    });

    if (missingTables.length > 0 || missingColumns.length > 0) {
      throw new Error(
        'Existing database schema is incomplete for this application. Missing tables: ' +
          (missingTables.join(', ') || 'none') +
          '; missing columns: ' +
          (missingColumns.join(', ') || 'none') +
          '. No existing table was changed.',
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable(ownershipTable))) {
      throw new Error(
        'This migration adopted an existing schema; rollback is disabled to protect its data.',
      );
    }

    for (const table of [...managedTables].reverse()) {
      await queryRunner.query('DROP TABLE IF EXISTS "' + table + '"');
    }
    for (const type of enumTypes) {
      await queryRunner.query('DROP TYPE IF EXISTS "' + type + '"');
    }
    await queryRunner.query('DROP TABLE "__brightloop_initial_schema_owned"');
  }
}
