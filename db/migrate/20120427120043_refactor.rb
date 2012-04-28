class Refactor < ActiveRecord::Migration
  def up
    change_table :collections do |t| 
      t.rename  :user_id, :tag_id
    end
  end

  def down
  end
end
