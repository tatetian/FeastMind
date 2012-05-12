class AddPaperIdToDocs < ActiveRecord::Migration
  def change
   add_column :docs, :paper_id, :int
  end
end
