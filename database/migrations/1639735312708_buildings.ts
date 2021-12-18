import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Buildings extends BaseSchema {
	protected tableName = 'buildings';

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments('id');

			table.integer('user_id').unsigned().notNullable()
				.references('users.id').onDelete('cascade');

			table.string('type').unsigned().notNullable();
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
