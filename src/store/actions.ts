import UserRepository from '@/data-access/UserRepository';
import { ItemCandidate, LanguageInfo, RootState } from '@/store/index';
import { ActionContext, ActionTree } from 'vuex';
import SearchEntityRepository, { SearchOptions, SearchResult } from '@/data-access/SearchEntityRepository';
import ReadingClaimsRepository, { ItemDataValue } from '@/data-access/ReadingClaimsRepository';
import SensesRepository from '@/data-access/SensesRepository';

export default (
	userRepository: UserRepository,
	searchEntityRepository: SearchEntityRepository,
	getClaimsRepository: ReadingClaimsRepository,
	sensesRepository: SensesRepository,
): ActionTree<RootState, RootState> => ( {
	async initApp( context: ActionContext<RootState, RootState> ): Promise<void> {
		const user = await userRepository.getCurrentUser();
		context.commit( 'setUser', user );
		context.commit( 'setInitializingDone' );
	},
	setLanguageInfo( context: ActionContext<RootState, RootState>, langInfo: LanguageInfo ): void {
		context.commit( 'setLanguageInfo', langInfo );
		context.dispatch( 'queryForSenses', langInfo );
	},
	async queryForSenses( context: ActionContext<RootState, RootState>, langInfo: LanguageInfo ): Promise<void> {
		const senses = await sensesRepository.getSensesWithoutItems(
			langInfo.code,
			langInfo.id,
		);
		context.commit( 'setSenses', senses );
	},
	async setSearchedItemCandidate(
		context: ActionContext<RootState, RootState>, itemCandidate: ItemCandidate,
	): Promise<void> {
		context.commit( 'setSearchedItemCandidate', itemCandidate );

		const claims = await getClaimsRepository.getClaims( itemCandidate.id );
		if ( claims.P31 && claims.P31[ 0 ].mainsnak.snaktype === 'value' ) {
			itemCandidate.classId = ( claims.P31[ 0 ].mainsnak.datavalue as ItemDataValue ).value.id;
		} else if ( claims.P279 && claims.P279[ 0 ].mainsnak.snaktype === 'value' ) {
			itemCandidate.classId = ( claims.P279[ 0 ].mainsnak.datavalue as ItemDataValue ).value.id;
		}
		context.commit( 'setSearchedItemCandidate', itemCandidate );
		context.dispatch( 'ensureItemLabel', {
			itemId: itemCandidate.classId,
			languageCode: context.getters.languageCode,
		} );
	},
	async searchItemValues(
		context: ActionContext<RootState, RootState>,
		options: SearchOptions,
	): Promise<SearchResult[]> {
		const itemResults = await searchEntityRepository.searchItemValues(
			options.search,
			options.limit,
			options.offset,
			options.languageCode,
		);

		if ( options.languageCode ) {
			// otherwise we would not know which language the search result is in (in principle)
			itemResults.forEach( ( value: SearchResult ) => {
				context.commit( 'setItemTerms', {
					...value,
					languageCode: options.languageCode,
				} );
			} );
		}

		return itemResults;
	},
	async getItemLanguageCode(
		_context: ActionContext<RootState, RootState>,
		itemId: string,
	): Promise<string | null> {
		const languageCodePid = 'P218';
		const claims = await getClaimsRepository.getClaims( itemId, languageCodePid );
		if ( !claims[ languageCodePid ] ) {
			return null;
		}
		return claims[ languageCodePid ][ 0 ].mainsnak.datavalue.value as string;
	},
} );
