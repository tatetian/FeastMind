class CreatePapers < ActiveRecord::Migration
  def change
    create_table :papers do |t|
      t.string :docid
      t.string :title
      t.string :author
      t.date :date
      t.string :publication
      t.string :abstract
      t.text :content

      t.timestamps
    end
  end
end
