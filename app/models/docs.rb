class Docs < ActiveRecord::Base
    attr_accessible :docid, :title, :author, :date, :content, :convert
    before_save { |docs| }
    validates :docid, presence: true, uniqueness: {case_sensitive:true}
    validates :title, presence: true
    validates :convert, presence: true
end
