import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Missions extends BaseSchema {
	protected tableName = 'missions';

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments('id');
			table.integer('user_id').unsigned().notNullable()
				.references('users.id').onDelete('cascade');

			table.string('type').notNullable();
			table.string('destination_id').notNullable();
			table.timestamp('started', { useTz: true }).nullable();
			table.integer('reward').unsigned().notNullable();
		});

		this.schema.alterTable('workers', (table) => {
			table.integer('mission_id').unsigned().nullable()
				.references('missions.id').onDelete('set null');
		});
	}

	public async down() {
		this.schema.alterTable('workers', (table) => {
			table.dropColumn('mission_id');
		});
		this.schema.dropTable(this.tableName);
	}
}
