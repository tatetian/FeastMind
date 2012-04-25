# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20120425135828) do

  create_table "collections", :force => true do |t|
    t.integer  "user_id"
    t.integer  "doc_id"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "collections", ["doc_id"], :name => "index_collections_on_doc_id"
  add_index "collections", ["user_id", "doc_id"], :name => "index_collections_on_user_id_and_doc_id", :unique => true
  add_index "collections", ["user_id"], :name => "index_collections_on_user_id"

  create_table "docs", :force => true do |t|
    t.string   "docid"
    t.string   "title"
    t.string   "author"
    t.date     "date"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.text     "content"
    t.integer  "convert"
  end

  add_index "docs", ["docid"], :name => "index_docs_on_docid", :unique => true

  create_table "tagged_collections", :force => true do |t|
    t.integer  "tag_id"
    t.integer  "collection_id"
    t.datetime "created_at",    :null => false
    t.datetime "updated_at",    :null => false
  end

  add_index "tagged_collections", ["collection_id"], :name => "index_tagged_collections_on_collection_id"
  add_index "tagged_collections", ["tag_id", "collection_id"], :name => "index_tagged_collections_on_tag_id_and_collection_id", :unique => true
  add_index "tagged_collections", ["tag_id"], :name => "index_tagged_collections_on_tag_id"

  create_table "tags", :force => true do |t|
    t.string   "name"
    t.integer  "user_id"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "tags", ["user_id"], :name => "index_tags_on_user_id"

  create_table "users", :force => true do |t|
    t.string   "name"
    t.string   "email"
    t.datetime "created_at",      :null => false
    t.datetime "updated_at",      :null => false
    t.string   "password_digest"
    t.string   "remember_token"
  end

  add_index "users", ["remember_token"], :name => "index_users_on_remember_token"

end
