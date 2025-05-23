"use client";

export const revalidate = 0;
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Repo {
  index: number;
  name: string;
  url: string;
  preview: string | null;
  description: string;
}

interface GitHubRepo {
  name: string;
  html_url: string;
  description: string | null;
  owner: {
    login: string;
  };
}

const GitHubRepos = () => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const reposPerPage = 8;

  useEffect(() => {
    const fetchAllRepos = async () => {
      let allRepos: GitHubRepo[] = [];
      let page = 1;
      const perPage = 100;
      let hasMore = true;

      try {
        while (hasMore) {
          const res = await fetch(
            `https://api.github.com/users/codewithsadee/repos?per_page=${perPage}&page=${page}`
          );
          const data: GitHubRepo[] = await res.json();

          if (!Array.isArray(data) || data.length === 0) {
            hasMore = false;
          } else {
            allRepos = [...allRepos, ...data];
            page++;
          }
        }

        const reposWithPreviews: Repo[] = await Promise.all(
          allRepos.map(async (repo, index) => {
            const branches = ["main", "master"];
            let previewUrl: string | null = null;

            for (const branch of branches) {
              const url = `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${branch}/readme-images/desktop.png`;
              const checkPreview = await fetch(url, { method: "HEAD" });
              if (checkPreview.ok) {
                previewUrl = url;
                break;
              }
            }

            return {
              index: index + 1,
              name: repo.name,
              //url: repo.html_url,
              url:"https://codewithsadee.github.io/"+repo.name,
              preview: previewUrl,
              description: repo.description || "No description available."
            };
          })
        );

        setRepos(reposWithPreviews);
      } catch (error) {
        console.error("Error fetching repositories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRepos();
  }, []);

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRepo = currentPage * reposPerPage;
  const indexOfFirstRepo = indexOfLastRepo - reposPerPage;
  const currentRepos = filteredRepos.slice(indexOfFirstRepo, indexOfLastRepo);
  const totalPages = Math.ceil(filteredRepos.length / reposPerPage);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Bedimcode&apos;s GitHub Repositories</h1>
      <div className="mb-4 flex justify-center">
        <Input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />
      </div>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentRepos.map((repo) => (
              <Card key={repo.name} className="shadow-lg rounded-xl overflow-hidden">
                {repo.preview ? (
                  <img
                    src={repo.preview}
                    alt={repo.name}
                    className="w-full h-48 object-fill bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-200 text-gray-500">
                    No Preview
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg font-semibold truncate">
                    {repo.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{repo.description}</p>
                  <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    <a href={repo.url} target="_blank" rel="noopener noreferrer">
                      View Repository
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-6 space-x-4">
            <Button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              Previous
            </Button>
            <span className="text-lg font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default GitHubRepos;
