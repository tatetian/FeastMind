class Collection < ActiveRecord::Base
  attr_accessible :doc_id,:user_id

  belongs_to :user
  belongs_to :doc
  has_many :tagged_collections, foreign_key: "collection_id", dependent: :destroy
  has_many :tags, through: :tagged_collections

  validates :user_id, presence: true
  validates :doc_id, presence: true
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
