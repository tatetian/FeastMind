class Doc < ActiveRecord::Base
    attr_accessible :docid, :title, :author, :date, :paper_id
    after_save { |doc| 
    
    }
 
    validates   :docid, presence: true
    validates   :paper_id, presence: true

    has_many    :collections, :foreign_key => "doc_id", :dependent => :destroy
    has_many    :tags, :through => :collections
    belongs_to  :paper

    default_scope :order => 'docs.created_at DESC'
end
