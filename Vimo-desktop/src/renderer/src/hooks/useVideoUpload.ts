import { useCallback } from 'react';
import { UploadedVideo } from '../types/chat';
import { generateVideoId, formatFileSize } from '../utils/chat';

interface UseVideoUploadProps {
  uploadedVideos: UploadedVideo[];
  setUploadedVideos: React.Dispatch<React.SetStateAction<UploadedVideo[]>>;
  onShowToast?: (message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const useVideoUpload = ({ uploadedVideos, setUploadedVideos, onShowToast }: UseVideoUploadProps) => {
  // Use Electron file selection API and upload to server
  const handleVideoUpload = useCallback(async () => {
    try {
      const result = await window.api.selectVideoFiles();
      
      if (result.success && result.files) {
        const newVideos: UploadedVideo[] = [];
        const duplicateFiles: string[] = [];
        
        for (const file of result.files) {
          // Check if the video already exists with the same path
          const isDuplicate = uploadedVideos.some(video => video.path === file.path);
          
          if (isDuplicate) {
            duplicateFiles.push(file.name);
          } else {
            try {
              console.log('🔄 Starting file upload for:', file.name);
              
              // Use Electron API to read file and upload
              console.log('📁 Reading file from:', file.path);
              
              // Create a new API endpoint for file upload through Electron
              const uploadResult = await window.api.uploadVideoToServer(file.path, file.name);
              console.log('📡 Upload result:', uploadResult);
              
              if (uploadResult.success) {
                const videoId = generateVideoId();
                // Use server file path if available, otherwise fall back to local path
                const serverPath = uploadResult.file_path || file.path;

                const newVideo: UploadedVideo = {
                  id: videoId,
                  name: file.name,
                  url: `file://${file.path}`, // Keep local path for preview
                  path: serverPath, // Use server path for processing
                  size: file.size,
                };

                newVideos.push(newVideo);
              } else {
                console.error('Failed to upload file:', uploadResult.error);
                if (onShowToast) {
                  onShowToast(`Failed to upload ${file.name}: ${uploadResult.error}`, 'error');
                }
              }
            } catch (uploadError) {
              console.error('Upload error:', uploadError);
              if (onShowToast) {
                onShowToast(`Failed to upload ${file.name}`, 'error');
              }
            }
          }
        }

        // Add new videos
        if (newVideos.length > 0) {
          setUploadedVideos((prev) => [...prev, ...newVideos]);
        }

        // If there are duplicate files, show a prompt
        if (duplicateFiles.length > 0 && onShowToast) {
          const message = duplicateFiles.length === 1 
            ? `Video "${duplicateFiles[0]}" has already been added and will not be duplicated.`
            : `${duplicateFiles.length} videos have already been added and will not be duplicated.`;
          
          onShowToast(message, 'info');
        }
      } else {
        console.error('Failed to select video files:', result.error);
      }
    } catch (error) {
      console.error('Error selecting video files:', error);
    }
  }, [uploadedVideos, setUploadedVideos, onShowToast]);

  // Keep compatibility with drag and drop upload - currently not supported
  const handleVideoUploadFromFiles = useCallback(async () => {
    console.warn('Drag and drop upload not supported. Please use the file picker button instead.');
  }, []);

  const removeVideo = useCallback((videoId: string) => {
    setUploadedVideos((prev) => {
      return prev.filter((v) => v.id !== videoId);
    });
  }, [setUploadedVideos]);

  return {
    handleVideoUpload,
    handleVideoUploadFromFiles,
    removeVideo,
    formatFileSize,
  };
}; 