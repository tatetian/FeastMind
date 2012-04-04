class PagesController < ApplicationController
  def home
  end
  def try_upload
  end
  def login
  end
  def upload
    # doc hash
    hash = _doc_hash 
    # save file
    uploaded_io = params[:file]
    output_dir  = Rails.root.join 'public', 'uploads', hash.to_s
    Dir.mkdir output_dir
    output_file = [output_dir, "uploaded.pdf"].join("/")
    File.open(output_file, 'wb') do |file|
      file.write(uploaded_io.read)
    end
    # parse file
    doc_text = %x[app/tools/pdf2json #{output_file}] 
    # save text
    text_file = [output_dir, "text.json"].join("/")
    output_file = File.new text_file, "wb"
    output_file.write doc_text
    # extract meta
    doc_meta = %x[app/tools/json2meta #{text_file}]
    # add doc id
    parsed_meta = ActiveSupport::JSON.decode doc_meta
    parsed_meta["id"] = hash
    doc_meta = ActiveSupport::JSON.encode parsed_meta 
    #json_response = {:file_name => uploaded_io.original_filena
    respond_to do |format| 
      format.html { head :no_content }
      format.json { render :json => doc_meta }
    end
  end

  private 

  def _doc_hash
    Random.rand(2**31-1)
  end
end
