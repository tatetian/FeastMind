class DropTaggedCollection < ActiveRecord::Migration
  def up
    drop_table :tagged_collections
  end

  def down
  end
end
