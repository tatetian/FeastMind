class DocsController < ApplicationController
    def index
        user = current_user
        selected_docs =  user.docs.order("docs.created_at DESC").limit(params[:limit]).offset(params[:start]).select("docs.id,title,author,date,docs.created_at")
        total = user.docs.count
        response = {
            :error => nil, 
            :result => {
                :entries => selected_docs, 
                :total => total
            } 
        }
        json = ActiveSupport::JSON.encode response
        respond_to do |format| 
            format.html { head :no_content }
            format.json { render :json => json }
        end            
    end    
    def create
        # save file
        uploaded_io = params[:file]
        require 'uuidtools'
        tmp_dir     = UUIDTools::UUID.timestamp_create.to_s + "-" + UUIDTools::UUID.random_create.to_s
        tmp_dir     = Rails.root.join 'public', 'uploads', 'tmp', tmp_dir
        Dir.mkdir   tmp_dir
        tmp_pdf_file = [tmp_dir, "uploaded.pdf"].join("/")
        File.open(tmp_pdf_file, 'wb') do |file|
          file.write(uploaded_io.read)
        end
        # doc hash
        hash = _doc_hash(tmp_pdf_file)         
        # parse file
        doc_text = %x[app/tools/pdf2json #{tmp_pdf_file}] 
        # save text
        tmp_text_file = [tmp_dir, "text.json"].join("/")
        File.open(tmp_text_file, 'wb') do |file|
            file.write(doc_text)
        end
        # extract meta
        doc_meta = %x[app/tools/json2meta #{tmp_text_file}]
        # add doc id
        parsed_meta = ActiveSupport::JSON.decode doc_meta
        parsed_meta["id"] = hash
        doc_meta = ActiveSupport::JSON.encode parsed_meta 
        #json_response = {:file_name => uploaded_io.original_filena
        @doc = Doc.new(docid: hash,title: parsed_meta["title"],author: parsed_meta["authors"],date: Date.parse(parsed_meta["date"]),content: doc_text,convert: 0)
        if @doc.save
            flash[:success] = "Upload Success!"
            respond_to do |format| 
                format.html { head :no_content }
                format.json { render :json => doc_meta }
            end
            # save PDF
            final_dir = Rails.root.join 'public','uploads',hash
            FileUtils.mv(tmp_dir, final_dir)
            # add collection            
            user = current_user
            user.collect! @doc
        else
            respond_to do |format| 
                format.html { head :no_content }
                format.json { render :json => "{error:\"failed\"}" }
            end
        #userdoc.create();
        # database
        # Docs.save id, title, author, date
        # UserDoc doc_id, user_id
        end
    end

  private 

      def _doc_hash(f)
        require 'digest/sha1'
        Digest::SHA1.hexdigest(File.read(f)).to_s

        Random.rand(2**31-1).to_s
      end
end
