class CreateDocs < ActiveRecord::Migration
  def change
    create_table :docs do |t|
      t.string :docid
      t.string :title
      t.string :author
      t.date :date

      t.timestamps
    end
  end
end
