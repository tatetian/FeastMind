class AddIndexToDocsDocid < ActiveRecord::Migration
  def change
    add_index :docs, :docid, unique: true
  end
end
