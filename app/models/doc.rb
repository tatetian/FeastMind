class Doc < ActiveRecord::Base
    attr_accessible :docid, :title, :author, :date, :content, :convert
    before_save { |doc| }
    has_many :collections, foreign_key: "doc_id",dependent:   :destroy
    has_many :users, through: :collections
 
    validates :docid, presence: true, uniqueness: {case_sensitive:true}
    validates :title, presence: true
    validates :convert, presence: true
end
