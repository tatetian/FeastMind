class Collection < ActiveRecord::Base
  attr_accessible :doc_id,:tag_id

  validates   :tag_id, presence: true
  validates   :doc_id, presence: true

  belongs_to  :tag
  belongs_to  :doc


  def tag?(tag)
    self.tagged_collections.find_by_tag_id(tag.id)
  end

  def tag!(tag)
    if(self.user_id == tag.user_id)
        self.tagged_collections.create!(tag_id: tag.id)
    end
  end

  def untag!(tag)
    self.tagged_collections.find_by_tag_id(tag.id).destroy
  end
end
