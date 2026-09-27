CREATE TABLE "organizations" (
	"dept_code" text PRIMARY KEY NOT NULL,
	"legal_title_en" text,
	"applied_title_en" text
);
--> statement-breakpoint
CREATE TABLE "program_labels" (
	"dept_code" text NOT NULL,
	"program_code" text NOT NULL,
	"plain_name" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "program_labels_dept_code_program_code_pk" PRIMARY KEY("dept_code","program_code")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"year" integer NOT NULL,
	"dept_code" text NOT NULL,
	"program_code" text NOT NULL,
	"type" text NOT NULL,
	"name_en" text,
	CONSTRAINT "programs_year_dept_code_program_code_type_pk" PRIMARY KEY("year","dept_code","program_code","type")
);
--> statement-breakpoint
CREATE TABLE "programs_spending" (
	"year" integer NOT NULL,
	"dept_code" text NOT NULL,
	"program_code" text NOT NULL,
	"expenditure" numeric,
	CONSTRAINT "programs_spending_year_dept_code_program_code_pk" PRIMARY KEY("year","dept_code","program_code")
);
