import { supabase } from '@/lib/supabase/client';
import type {
  UILocation,
  AgentContext,
  ProductRequirement,
  RelatedRequirements,
  ConceptDictionary,
  Draft,
} from './types';

/**
 * Context Provider
 *
 * UI位置情報からAgentに注入するコンテキストを構築する
 */
export class ContextProvider {
  /**
   * コンテキストを構築する
   */
  static async buildContext(location: UILocation): Promise<AgentContext> {

    // プロダクト要件を取得
    const productRequirement = await this.getProductRequirement(
      supabase,
      location.projectId
    );

    // 関連要件を取得
    const relatedRequirements = await this.getRelatedRequirements(
      supabase,
      location
    );

    // 概念辞書を取得
    const conceptDictionary = await this.getConceptDictionary(
      supabase,
      location.projectId
    );

    // 最近の草案を取得（実装は後回し）
    const recentDrafts: Draft[] = [];

    return {
      product_requirement: productRequirement,
      current_location: location,
      related_requirements: relatedRequirements,
      concept_dictionary: conceptDictionary,
      recent_drafts: recentDrafts,
    };
  }

  /**
   * プロダクト要件を取得
   */
  private static async getProductRequirement(
    supabase: any,
    projectId: string
  ): Promise<ProductRequirement | null> {
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, product_requirement:product_requirements(*)')
      .eq('id', projectId)
      .single();

    if (!project?.product_requirement) {
      return null;
    }

    const pr = project.product_requirement;
    return {
      id: pr.id,
      name: project.name,
      tech_stack_profile: pr.tech_stack_profile || '',
      coding_conventions: pr.coding_conventions || '',
      quality_goals: pr.quality_goals || '',
    };
  }

  /**
   * 関連要件を取得
   */
  private static async getRelatedRequirements(
    supabase: any,
    location: UILocation
  ): Promise<RelatedRequirements> {
    const related: RelatedRequirements = {};

    // 位置に応じて関連要件を取得
    switch (location.type) {
      case 'bd': {
        // BD配下のBTを取得
        const { data: bts } = await supabase
          .from('business_tasks')
          .select('*')
          .eq('business_domain_id', location.id)
          .order('code');
        related.business_tasks = bts || [];
        break;
      }
      case 'bt': {
        // BT配下のBRを取得
        const { data: brs } = await supabase
          .from('business_requirements')
          .select('*')
          .eq('business_task_id', location.id)
          .order('code');
        related.business_requirements = brs || [];
        break;
      }
      case 'sd': {
        // SD配下のSFを取得
        const { data: sfs } = await supabase
          .from('system_functions')
          .select('*')
          .eq('system_domain_id', location.id)
          .order('code');
        related.system_functions = sfs || [];
        break;
      }
      case 'sf': {
        // SF配下のSRを取得
        const { data: srs } = await supabase
          .from('system_requirements')
          .select('*')
          .eq('system_function_id', location.id)
          .order('code');
        related.system_requirements = srs || [];
        break;
      }
    }

    return related;
  }

  /**
   * 概念辞書を取得
   */
  private static async getConceptDictionary(
    supabase: any,
    projectId: string
  ): Promise<ConceptDictionary[]> {
    const { data: concepts } = await supabase
      .from('concepts')
      .select('id, term, definition, aliases')
      .eq('project_id', projectId)
      .order('term');

    return concepts || [];
  }

  /**
   * 初期プロンプトを生成
   */
  static buildInitialPrompt(location: UILocation): string {
    switch (location.type) {
      case 'bd':
        return `業務領域「${location.name}」に業務タスクを追加します。どのような業務を登録しますか？`;
      case 'bt':
        return `業務タスク「${location.name}」に業務要件を追加します。この業務で達成したいことは何ですか？`;
      case 'sf':
        return `システム機能「${location.name}」にシステム要件を追加します。どのような要件を追加しますか？`;
      case 'sd':
        return `システム領域「${location.name}」にシステム機能を追加します。どのような機能を登録しますか？`;
      case 'cr':
        return `変更要求「${location.name}」の影響調査を行います。変更内容を教えてください。`;
      case 'project':
        return `プロジェクト「${location.name}」の要件管理をサポートします。何をお手伝いしましょうか？`;
      default:
        return `要件管理をサポートします。何をお手伝いしましょうか？`;
    }
  }

  /**
   * threadId を生成（セッション識別子）
   */
  static generateThreadId(location: UILocation, sessionId?: string): string {
    const base = `${location.projectId}-${location.type}-${location.id}`;
    return sessionId ? `${base}-${sessionId}` : base;
  }

  /**
   * resourceId を生成（ユーザー/プロジェクト識別子）
   */
  static generateResourceId(
    projectId: string,
    userId?: string
  ): string {
    return userId ? `${projectId}-${userId}` : projectId;
  }
}
