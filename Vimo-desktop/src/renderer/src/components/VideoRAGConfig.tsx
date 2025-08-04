import { useState, useEffect } from 'react'
import { X, Settings, CheckCircle, AlertCircle, Play, Square, RefreshCw, Globe } from 'lucide-react'
import { Button } from './ui/button'
import { useVideoRAG, VideoRAGConfig } from '../hooks/useVideoRAG'
import { useVideoRAGService } from '../hooks/useVideoRAGService'

interface VideoRAGConfigProps {
  isOpen: boolean
  onClose: () => void
}

export const VideoRAGConfigModal = ({ isOpen, onClose }: VideoRAGConfigProps) => {
  const { initialize, loading, error, clearError } = useVideoRAG()
  const { 
    serviceState, 
    loading: serviceLoading, 
    checkServiceStatus, 
    startService, 
    stopService 
  } = useVideoRAGService()
  
  const [config, setConfig] = useState<VideoRAGConfig>({
    ali_dashscope_api_key: '',
    ali_dashscope_base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    tongyi_api_key: '',  // 使用通义千问API密钥
    tongyi_base_url: 'https://dashscope.aliyuncs.com/api/v1',  // 使用通义千问基础URL
    image_bind_model_path: '/Users/renxubin/Desktop/videorag-store/imagebind_huge/imagebind_huge.pth',
    base_storage_path: './videorag-sessions'
  })

  // 远程服务器配置
  const [remoteConfig, setRemoteConfig] = useState({
    enabled: false,
    host: '192.168.1.100', // 默认Ubuntu服务器IP
    port: 64451
  })
  
  // Local check configuration completeness, not dependent on network status
  const isConfigured = !!(config.tongyi_api_key &&  // 检查通义千问API密钥
                          config.ali_dashscope_api_key && 
                          config.image_bind_model_path)
  
  const [showApiKeys, setShowApiKeys] = useState(false)

  // Load saved config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('videorag-config')
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error('Failed to load saved config:', error)
      }
    }
    
    // Load remote server config
    const savedRemoteConfig = localStorage.getItem('videorag-remote-config')
    if (savedRemoteConfig) {
      try {
        setRemoteConfig(JSON.parse(savedRemoteConfig))
      } catch (error) {
        console.error('Failed to load remote config:', error)
      }
    }
  }, [])

  const handleConfigChange = (field: keyof VideoRAGConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    // Save config to localStorage
    localStorage.setItem('videorag-config', JSON.stringify(config))
    localStorage.setItem('videorag-remote-config', JSON.stringify(remoteConfig))
    
    // Configure remote server if enabled
    if (remoteConfig.enabled) {
      try {
        await window.api.videorag.configureRemoteServer(remoteConfig)
        console.log('Remote server configured successfully')
      } catch (error) {
        console.error('Failed to configure remote server:', error)
      }
    }
    
    // Initialize VideoRAG
    const success = await initialize(config)
    if (success) {
      onClose()
    }
  }

  const selectImageBindPath = async () => {
    try {
      const result = await window.api.selectFolder()
      if (result.success && result.path) {
        // Assume the model file is in the selected folder
        const modelPath = `${result.path}/imagebind_huge.pth`
        handleConfigChange('image_bind_model_path', modelPath)
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <h2 className="text-xl font-semibold">VideoRAG Configuration</h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Service Status */}
          <div className="space-y-4">
            {/* Service Control */}
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">VideoRAG Service</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkServiceStatus}
                    disabled={serviceLoading.checkingService}
                  >
                    {serviceLoading.checkingService ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                  {serviceState.isRunning ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={stopService}
                      disabled={serviceLoading.stopping}
                    >
                      {serviceLoading.stopping ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      Stop
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={startService}
                      disabled={serviceLoading.starting}
                    >
                      {serviceLoading.starting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Start
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm">
                {serviceState.isRunning ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Service is running</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600">Service is stopped</span>
                  </div>
                )}
                {serviceState.message && (
                  <div className="text-xs text-gray-500 mt-1">{serviceState.message}</div>
                )}
                {serviceState.error && (
                  <div className="text-xs text-red-500 mt-1">{serviceState.error}</div>
                )}
              </div>
            </div>

            {/* Remote Server Configuration */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Remote Server Configuration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remote-enabled"
                    checked={remoteConfig.enabled}
                    onChange={(e) => setRemoteConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="remote-enabled" className="text-sm font-medium text-blue-700">
                    Enable Remote Server
                  </label>
                </div>
              </div>
              
              {remoteConfig.enabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Server Host
                      </label>
                      <input
                        type="text"
                        value={remoteConfig.host}
                        onChange={(e) => setRemoteConfig(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="192.168.1.100"
                        className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Port
                      </label>
                      <input
                        type="number"
                        value={remoteConfig.port}
                        onChange={(e) => setRemoteConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 64451 }))}
                        placeholder="64451"
                        className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-blue-600">
                    💡 Configure this to connect to a remote Ubuntu server running VideoRAG API
                  </div>
                </div>
              )}
            </div>

            {/* Configuration Status */}
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2">
                {isConfigured ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-medium">
                  Configuration: {isConfigured ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              {isConfigured && (
                <p className="text-sm text-green-600 mt-1">
                  Global configuration is set and ready for use
                </p>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearError}
                    className="mt-2"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">API Keys</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowApiKeys(!showApiKeys)}
              >
                {showApiKeys ? 'Hide' : 'Show'} Keys
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  通义千问 API 密钥 *
                </label>
                <input
                  type={showApiKeys ? 'text' : 'password'}
                  value={config.tongyi_api_key}
                  onChange={(e) => handleConfigChange('tongyi_api_key', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  通义千问 Base URL
                </label>
                <input
                  type="text"
                  value={config.tongyi_base_url}
                  onChange={(e) => handleConfigChange('tongyi_base_url', e.target.value)}
                  placeholder="https://dashscope.aliyuncs.com/api/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Alibaba DashScope API Key *
                </label>
                <input
                  type={showApiKeys ? 'text' : 'password'}
                  value={config.ali_dashscope_api_key}
                  onChange={(e) => handleConfigChange('ali_dashscope_api_key', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  DashScope Base URL
                </label>
                <input
                  type="text"
                  value={config.ali_dashscope_base_url}
                  onChange={(e) => handleConfigChange('ali_dashscope_base_url', e.target.value)}
                  placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Model Path Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Model Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                ImageBind Model Path *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={config.image_bind_model_path}
                  onChange={(e) => handleConfigChange('image_bind_model_path', e.target.value)}
                  placeholder="/path/to/imagebind_huge.pth"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={selectImageBindPath} variant="outline">
                  Browse
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Path to the ImageBind model file (imagebind_huge.pth)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Base Storage Directory
              </label>
              <input
                type="text"
                value={config.base_storage_path}
                onChange={(e) => handleConfigChange('base_storage_path', e.target.value)}
                placeholder="./videorag-sessions"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Base directory where each chat session will create its own subdirectory
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading.initializing || !config.tongyi_api_key || !config.ali_dashscope_api_key || !config.image_bind_model_path}
          >
            {loading.initializing ? 'Configuring...' : 'Save & Configure'}
          </Button>
        </div>
      </div>
    </div>
  )
} 