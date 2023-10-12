import {
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DirectoryConfig,
  DirectoryRequest,
  ImageRequestHandler,
  NetworkRequest,
  PagedResult,
  RunnerInfo,
} from "@suwatte/daisuke";
import { TachiCatalogSource, TachiHttpSource } from "./source";

export class TachiBuilder implements ContentSource, ImageRequestHandler {
  info: RunnerInfo;
  source: TachiCatalogSource;

  constructor(info: RunnerInfo, template: new () => TachiCatalogSource) {
    this.source = new template();
    this.info = { ...info, supportedLanguages: [this.source.lang] };
  }

  async getContent(contentId: string): Promise<Content> {
    return this.source.getMangaDetails(contentId);
  }

  async getChapters(contentId: string): Promise<Chapter[]> {
    return this.source.getMangaChapters(contentId);
  }

  async getChapterData(
    contentId: string,
    chapterId: string
  ): Promise<ChapterData> {
    return this.source.getPageList(contentId, chapterId);
  }
  async getDirectory(search: DirectoryRequest): Promise<PagedResult> {
    if (
      !search.query &&
      !search.filters &&
      (search.sort?.id === "popular" || search.sort?.id === "latest")
    ) {
      const isPopular = search.sort?.id === "popular";
      return isPopular
        ? this.source.getPopularManga(search.page)
        : this.source.getLatestManga(search.page);
    } else {
      return this.source.getSearchManga(search);
    }
  }

  async getDirectoryConfig(_: string | undefined): Promise<DirectoryConfig> {
    return {
      sort: {
        default: { id: "popular" },
        options: (() => {
          const options = [
            {
              id: "popular",
              title: "Popular",
            },
          ];
          if (this.source.supportsLatest) {
            options.push({
              id: "latest",
              title: "Latest",
            });
          }
          return options;
        })(),
      },
      filters: await this.source.getFilterList(),
    };
  }

  // * Image Request Handler
  async willRequestImage(imageURL: string): Promise<NetworkRequest> {
    if (this.source instanceof TachiHttpSource) {
      return this.source.imageRequest(imageURL);
    } else {
      return { url: imageURL };
    }
  }
}
