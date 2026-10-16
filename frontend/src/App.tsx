import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Picture Restore
        </h1>
        <p className="text-gray-600 mb-8">
          电商商品图与营销素材自动化生成系统
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">快速开始</h2>
          <p className="text-gray-700 mb-4">
            上传商品图片，AI 自动生成白底图、场景图、促销图等多种营销素材。
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    alert(`选择了文件: ${file.name}`)
                  }
                }}
              />
              <div className="text-6xl mb-4">📸</div>
              <div className="text-lg text-gray-700 mb-2">
                点击上传图片
              </div>
              <div className="text-sm text-gray-500">
                支持 JPG, PNG 格式
              </div>
            </label>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-semibold mb-1">智能分层</h3>
              <p className="text-sm text-gray-600">自动识别商品主体和背景</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-semibold mb-1">AI 生成</h3>
              <p className="text-sm text-gray-600">一键生成多种场景效果</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold mb-1">保真处理</h3>
              <p className="text-sm text-gray-600">保持商品细节完整</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">系统状态</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">前端:</span>
              <span className="text-green-600 font-medium">✓ 运行中 (http://localhost:5174)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">后端 API:</span>
              <span className="text-green-600 font-medium">✓ 运行中 (http://localhost:8888)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">数据库:</span>
              <span className="text-yellow-600 font-medium">⏳ 待配置</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
