import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error) {
    console.error('[ErrorBoundary]', error.message)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900">حدث خطأ غير متوقع</h2>
          <p className="text-gray-500 text-sm">
            نعتذر، حدث خطأ في هذه الصفحة. يمكنك إعادة المحاولة.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600"
            >
              إعادة المحاولة
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
            >
              الرئيسية
            </button>
          </div>
        </div>
      </div>
    )
  }
}
