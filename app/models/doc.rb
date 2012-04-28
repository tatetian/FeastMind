class Doc < ActiveRecord::Base
    attr_accessible :docid, :title, :author, :date, :content, :convert
    before_save { |doc| }
 
    validates   :docid, presence: true, uniqueness: {case_sensitive:true}
    validates   :title, presence: true
    validates   :convert, presence: true

    has_many    :collections, :foreign_key => "doc_id", :dependent => :destroy
    has_many    :tags, through: :collections

    default_scope :order => 'docs.created_at DESC'
end
