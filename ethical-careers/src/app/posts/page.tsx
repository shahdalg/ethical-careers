import { getPosts, Post } from "@/lib/getPosts";

export default async function PostsPage() {
  const posts: Post[] = await getPosts();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4" style={{ color: "#3D348B" }}>Posts</h1>
      {posts.map((post) => (
        <div key={post.id} className="border p-4 rounded mb-4">
          <h2 className="font-semibold">People</h2>
          <p>{post.peopleText}</p>
          <p>Rating: {post.peopleRating}</p>

          <h2 className="font-semibold mt-2">Principles</h2>
          <p>{post.principlesText}</p>
          <p>Rating: {post.principlesRating}</p>

          <h2 className="font-semibold mt-2">Transparency</h2>
          <p>{post.transparencyText}</p>
          <p>Rating: {post.transparencyRating}</p>

          <p className="text-sm text-gray-500 mt-2">
            Submitted at: {post.createdAt?.toDate?.().toLocaleString?.()}
          </p>
        </div>
      ))}
    </main>
  );
}
