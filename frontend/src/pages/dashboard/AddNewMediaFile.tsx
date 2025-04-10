import { useDropzone } from 'react-dropzone';
import { useState, useCallback } from 'react';
import { X } from 'lucide-react';

function AddNewMediaFile() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    setUploadStatus(null); // Clear any previous status messages
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles(prevFiles => 
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
    setUploadStatus(null);
  };

  const uploadFilesToServer = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadStatus(null);
    
    try {
      // Create FormData object for multipart/form-data upload
      const formData = new FormData();
      
      // append each file to the FormData object
      uploadedFiles.forEach((file) => {
        formData.append('files', file); // 'files' is the field name the backend expects
      });
      
      // add metadata
      formData.append('uploadedBy', 'admin');
      
      // placeholder POST request to API endpoint
      const response = await fetch('http://your-backend-url/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`, 
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload files');
      }

      setUploadStatus({
        success: true,
        message: data.message || `Successfully uploaded ${uploadedFiles.length} file(s)`
      });

      setUploadedFiles([]);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload files'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const fileItems = uploadedFiles.map((file, index) => (
    <li key={index} className="flex justify-between items-center py-2 border-b">
      <span>{file.name} - {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
      <X
        size={20}
        onClick={() => removeFile(index)}
        className="text-red-700 hover:text-red-900"
      />
    </li>
  ));

  return (
    <div className="mx-10 h-dvh">
      <h4 className="my-10 text-3xl tracking-wider text-nique-blue">
        Upload New Media Files
      </h4>
      <div {...getRootProps({className: 'dropzone w-full h-96 border-2 border-dashed border-gray-400 rounded-lg p-4 flex items-center justify-center bg-nique-blue/5'})}>
        <input {...getInputProps()} />
        <h4 className='text-2xl'>Drag 'n' drop some files here, or click to select files</h4>
      </div>
      <div className="w-full h-auto min-h-96 mt-4">
        <h4 className='text-xl'>Uploaded Files: {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ''}</h4>
        <ul className="mt-4">{fileItems}</ul>

        {uploadStatus && (
          <div className={`mt-4 p-3 rounded ${uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {uploadStatus.message}
          </div>
        )}
        
        <div className="flex w-full justify-end mt-8 mb-4">
          <button 
            className='bg-nique-blue text-white px-4 py-2 rounded-lg hover:bg-nique-blue-hover transition disabled:bg-gray-400'
            disabled={uploadedFiles.length === 0 || isUploading}
            onClick={uploadFilesToServer}
          >
            {isUploading ? 'Uploading...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddNewMediaFile;