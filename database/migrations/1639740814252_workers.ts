import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Workers extends BaseSchema {
	protected tableName = 'workers';

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments('id');

			table.integer('user_id').unsigned().notNullable()
				.references('users.id').onDelete('cascade');
			table.integer('building_id').unsigned().nullable()
				.references('buildings.id').onDelete('set null');

			table.string('name').notNullable();
			table.boolean('hired').notNullable().defaultTo(false);
			table.integer('mission').unsigned().nullable();

			table.integer('skill_strength').unsigned().notNullable();
			table.integer('skill_stealth').unsigned().notNullable();
			table.integer('skill_crafting').unsigned().notNullable();
			table.integer('wage').unsigned().notNullable();

			table.timestamp('updated', { useTz: true });
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
