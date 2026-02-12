import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">404</h2>
            <p className="text-gray-600 mb-6">Page Not Found</p>
            <Link href="/" className="text-indigo-600 hover:underline">
                Return Home
            </Link>
        </div>
    );
}
