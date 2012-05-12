class Paper < ActiveRecord::Base
  attr_accessible :docid, :title, :author, :date, :publication, :content, :abstract, :convert

  has_many :docs, dependent: :destroy

  validates   :docid, presence: true, uniqueness: {case_sensitive:true}
  validates   :title, presence: true
end
