exports['graphqlToCommits converts raw graphql response into Commits object 1'] = {
  "endCursor": "0a8477108a26aeb21d7af06e62be4ae5cb00ad42 31",
  "hasNextPage": true,
  "commits": [
    {
      "sha": "0a8477108a26aeb21d7af06e62be4ae5cb00ad42",
      "message": "fix: Update PubSub timeouts. (#1967)",
      "files": [
        "PubSub/src/V1/resources/subscriber_client_config.json",
        "PubSub/synth.metadata"
      ]
    },
    {
      "sha": "269cf923ea6fd0375abaf0bb19790475693c6f90",
      "message": "fix: Assorted minor fixes for Cloud Datastore client (#1964)",
      "files": [
        "Datastore/src/Connection/Grpc.php",
        "Datastore/src/DatastoreClient.php",
        "Datastore/src/Entity.php",
        "Datastore/src/EntityIterator.php",
        "Datastore/src/EntityMapper.php",
        "Datastore/src/Key.php",
        "Datastore/src/Operation.php",
        "Datastore/src/TransactionTrait.php"
      ]
    },
    {
      "sha": "da356f004ff891e11a369fd634f55d6abade708f",
      "message": "Prepare v0.102.0 (#1965)",
      "files": [
        "AutoMl/VERSION",
        "Debugger/VERSION",
        "Debugger/src/DebuggerClient.php",
        "Dialogflow/VERSION",
        "Firestore/VERSION",
        "Firestore/src/FirestoreClient.php",
        "Language/VERSION",
        "Language/src/LanguageClient.php",
        "Speech/VERSION",
        "Speech/src/SpeechClient.php",
        "Tasks/VERSION",
        "Vision/VERSION",
        "Vision/src/VisionClient.php",
        "WebSecurityScanner/VERSION",
        "composer.json",
        "docs/manifest.json",
        "src/ServiceBuilder.php",
        "src/Version.php"
      ]
    },
    {
      "sha": "fa5761e9e52f36506a72a9292843259d198468b0",
      "message": "feat: Add Web Security Center Client (#1961)\n\n* add synth script\r\n\r\n* generate web security scanner\r\n\r\n* add to docs site\r\n\r\n* update README\r\n\r\n* update composer\r\n\r\n* remove whitespace in sample\r\n\r\n* add phpunit config\r\n\r\n* add hyperlink\r\n\r\n* autoload tests\r\n\r\n* more autoload fixes",
      "files": [
        "README.md",
        "WebSecurityScanner/.gitattributes",
        "WebSecurityScanner/.github/pull_request_template.md",
        "WebSecurityScanner/CONTRIBUTING.md",
        "WebSecurityScanner/LICENSE",
        "WebSecurityScanner/README.md",
        "WebSecurityScanner/composer.json",
        "WebSecurityScanner/metadata/V1Beta/CrawledUrl.php",
        "WebSecurityScanner/metadata/V1Beta/Finding.php",
        "WebSecurityScanner/metadata/V1Beta/FindingAddon.php",
        "WebSecurityScanner/metadata/V1Beta/FindingTypeStats.php",
        "WebSecurityScanner/metadata/V1Beta/ScanConfig.php",
        "WebSecurityScanner/metadata/V1Beta/ScanConfigError.php",
        "WebSecurityScanner/metadata/V1Beta/ScanRun.php",
        "WebSecurityScanner/metadata/V1Beta/ScanRunErrorTrace.php",
        "WebSecurityScanner/metadata/V1Beta/ScanRunWarningTrace.php",
        "WebSecurityScanner/metadata/V1Beta/WebSecurityScanner.php",
        "WebSecurityScanner/phpunit.xml.dist",
        "WebSecurityScanner/src/V1beta/CrawledUrl.php",
        "WebSecurityScanner/src/V1beta/CreateScanConfigRequest.php",
        "WebSecurityScanner/src/V1beta/DeleteScanConfigRequest.php",
        "WebSecurityScanner/src/V1beta/Finding.php",
        "WebSecurityScanner/src/V1beta/FindingTypeStats.php",
        "WebSecurityScanner/src/V1beta/Form.php",
        "WebSecurityScanner/src/V1beta/Gapic/WebSecurityScannerGapicClient.php",
        "WebSecurityScanner/src/V1beta/GetFindingRequest.php",
        "WebSecurityScanner/src/V1beta/GetScanConfigRequest.php",
        "WebSecurityScanner/src/V1beta/GetScanRunRequest.php",
        "WebSecurityScanner/src/V1beta/ListCrawledUrlsRequest.php",
        "WebSecurityScanner/src/V1beta/ListCrawledUrlsResponse.php",
        "WebSecurityScanner/src/V1beta/ListFindingTypeStatsRequest.php",
        "WebSecurityScanner/src/V1beta/ListFindingTypeStatsResponse.php",
        "WebSecurityScanner/src/V1beta/ListFindingsRequest.php",
        "WebSecurityScanner/src/V1beta/ListFindingsResponse.php",
        "WebSecurityScanner/src/V1beta/ListScanConfigsRequest.php",
        "WebSecurityScanner/src/V1beta/ListScanConfigsResponse.php",
        "WebSecurityScanner/src/V1beta/ListScanRunsRequest.php",
        "WebSecurityScanner/src/V1beta/ListScanRunsResponse.php",
        "WebSecurityScanner/src/V1beta/OutdatedLibrary.php",
        "WebSecurityScanner/src/V1beta/README.md",
        "WebSecurityScanner/src/V1beta/ScanConfig.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/Authentication.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/Authentication/CustomAccount.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/Authentication/GoogleAccount.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/ExportToSecurityCommandCenter.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/RiskLevel.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/Schedule.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/TargetPlatform.php",
        "WebSecurityScanner/src/V1beta/ScanConfig/UserAgent.php",
        "WebSecurityScanner/src/V1beta/ScanConfigError.php",
        "WebSecurityScanner/src/V1beta/ScanConfigError/Code.php",
        "WebSecurityScanner/src/V1beta/ScanConfigError_Code.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_Authentication.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_Authentication_CustomAccount.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_Authentication_GoogleAccount.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_ExportToSecurityCommandCenter.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_RiskLevel.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_Schedule.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_TargetPlatform.php",
        "WebSecurityScanner/src/V1beta/ScanConfig_UserAgent.php",
        "WebSecurityScanner/src/V1beta/ScanRun.php",
        "WebSecurityScanner/src/V1beta/ScanRun/ExecutionState.php",
        "WebSecurityScanner/src/V1beta/ScanRun/ResultState.php",
        "WebSecurityScanner/src/V1beta/ScanRunErrorTrace.php",
        "WebSecurityScanner/src/V1beta/ScanRunErrorTrace/Code.php",
        "WebSecurityScanner/src/V1beta/ScanRunErrorTrace_Code.php",
        "WebSecurityScanner/src/V1beta/ScanRunWarningTrace.php",
        "WebSecurityScanner/src/V1beta/ScanRunWarningTrace/Code.php",
        "WebSecurityScanner/src/V1beta/ScanRunWarningTrace_Code.php",
        "WebSecurityScanner/src/V1beta/ScanRun_ExecutionState.php",
        "WebSecurityScanner/src/V1beta/ScanRun_ResultState.php",
        "WebSecurityScanner/src/V1beta/StartScanRunRequest.php",
        "WebSecurityScanner/src/V1beta/StopScanRunRequest.php",
        "WebSecurityScanner/src/V1beta/UpdateScanConfigRequest.php",
        "WebSecurityScanner/src/V1beta/ViolatingResource.php",
        "WebSecurityScanner/src/V1beta/VulnerableHeaders.php",
        "WebSecurityScanner/src/V1beta/VulnerableHeaders/Header.php",
        "WebSecurityScanner/src/V1beta/VulnerableHeaders_Header.php",
        "WebSecurityScanner/src/V1beta/VulnerableParameters.php",
        "WebSecurityScanner/src/V1beta/WebSecurityScannerClient.php",
        "WebSecurityScanner/src/V1beta/WebSecurityScannerGrpcClient.php",
        "WebSecurityScanner/src/V1beta/Xss.php",
        "WebSecurityScanner/src/V1beta/resources/web_security_scanner_client_config.json",
        "WebSecurityScanner/src/V1beta/resources/web_security_scanner_descriptor_config.php",
        "WebSecurityScanner/src/V1beta/resources/web_security_scanner_rest_client_config.php",
        "WebSecurityScanner/synth.metadata",
        "WebSecurityScanner/synth.py",
        "WebSecurityScanner/tests/Unit/V1beta/WebSecurityScannerClientTest.php",
        "composer.json",
        "docs/contents/cloud-web-security-scanner.json",
        "docs/contents/google-cloud.json",
        "docs/manifest.json"
      ]
    },
    {
      "sha": "8db7f3b19c46c873897d79c89ce35b8492e5fe60",
      "message": "feat!: move speech from alpha -> beta (#1962)",
      "files": [
        "README.md",
        "Speech/README.md"
      ]
    },
    {
      "sha": "52f4fbfa1fc3fde585c84e64ef40571d2b85d72e",
      "message": "fix: correctly label as beta (#1963)",
      "files": [
        "AutoMl/README.md"
      ]
    },
    {
      "sha": "da6e52d956c1e35d19e75e0f2fdba439739ba364",
      "message": "feat: Add mp3 encoding and context hint boost support. (#1959)",
      "files": [
        "Speech/metadata/V1P1Beta1/CloudSpeech.php",
        "Speech/src/V1p1beta1/RecognitionConfig/AudioEncoding.php",
        "Speech/src/V1p1beta1/SpeechContext.php",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "bf69d0f204474b88b3f8b5a72a392129d16a3929",
      "message": "fix: language system test (#1958)",
      "files": [
        "Language/tests/System/AnalyzeTest.php"
      ]
    },
    {
      "sha": "a8b5b0bc9e9ed7998e30983834f7d841b6a37d6f",
      "message": "fix: continue switch targeting warning in PHP 7.3 (#1957)",
      "files": [
        "Debugger/src/Agent.php"
      ]
    },
    {
      "sha": "cf52ec0bcdc777dc9c5e76153d7d253bea95d44b",
      "message": "feat: Add Collection Group Query support (#1944)\n\n* Add Collection Group Query support\r\n\r\n* Fix documentation\r\n\r\n* Address code review\r\n\r\n* Throw from createDocumentReference",
      "files": [
        "Firestore/src/Connection/Grpc.php",
        "Firestore/src/FieldPath.php",
        "Firestore/src/FirestoreClient.php",
        "Firestore/src/Query.php",
        "Firestore/src/SnapshotTrait.php",
        "Firestore/tests/Snippet/CollectionReferenceTest.php",
        "Firestore/tests/Snippet/FieldPathTest.php",
        "Firestore/tests/Snippet/FirestoreClientTest.php",
        "Firestore/tests/Snippet/QueryTest.php",
        "Firestore/tests/System/CollectionGroupTest.php",
        "Firestore/tests/System/FirestoreTestCase.php",
        "Firestore/tests/Unit/CollectionReferenceTest.php",
        "Firestore/tests/Unit/FieldPathTest.php",
        "Firestore/tests/Unit/FirestoreClientTest.php",
        "Firestore/tests/Unit/QueryTest.php"
      ]
    },
    {
      "sha": "ad9f0bcd33f33f718d02a916f3777d5a89fa1caa",
      "message": "[CHANGE ME] Re-generated Vision to pick up changes in the API or client library generator. (#1954)",
      "files": [
        "Vision/src/V1/Product.php",
        "Vision/src/V1/ProductSearchParams.php",
        "Vision/synth.metadata"
      ]
    },
    {
      "sha": "31ca3ccea630ab5c164a21a30753ee617f5a3978",
      "message": "docs: Documentation updates. (#1956)",
      "files": [
        "Dialogflow/metadata/V2/Agent.php",
        "Dialogflow/metadata/V2/Context.php",
        "Dialogflow/metadata/V2/EntityType.php",
        "Dialogflow/metadata/V2/Intent.php",
        "Dialogflow/metadata/V2/Session.php",
        "Dialogflow/metadata/V2/SessionEntityType.php",
        "Dialogflow/src/V2/Intent.php",
        "Dialogflow/src/V2/Intent/Message/Platform.php",
        "Dialogflow/src/V2/QueryResult.php",
        "Dialogflow/synth.metadata"
      ]
    },
    {
      "sha": "f67dc1c24b2704e6b1fd0aea35340691b7ee33c9",
      "message": "feat: Add Stackdriver logging config, update documentation. (#1950)",
      "files": [
        "Tasks/metadata/V2/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Queue.php",
        "Tasks/src/V2/AppEngineHttpRequest.php",
        "Tasks/src/V2/CloudTasksGrpcClient.php",
        "Tasks/src/V2/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2/ListQueuesRequest.php",
        "Tasks/src/V2/ListTasksRequest.php",
        "Tasks/src/V2beta3/AppEngineHttpRequest.php",
        "Tasks/src/V2beta3/CloudTasksGrpcClient.php",
        "Tasks/src/V2beta3/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2beta3/HttpRequest.php",
        "Tasks/src/V2beta3/ListQueuesRequest.php",
        "Tasks/src/V2beta3/ListTasksRequest.php",
        "Tasks/src/V2beta3/OAuthToken.php",
        "Tasks/src/V2beta3/OidcToken.php",
        "Tasks/src/V2beta3/Queue.php",
        "Tasks/src/V2beta3/StackdriverLoggingConfig.php",
        "Tasks/src/V2beta3/Task.php",
        "Tasks/synth.metadata",
        "Tasks/tests/Unit/V2beta3/CloudTasksClientTest.php"
      ]
    },
    {
      "sha": "d323a48a3d6aeb659eb45927e16b1da9532c84a9",
      "message": "feat: Add recognition metadata, result end time and language code. (#1949)",
      "files": [
        "Speech/metadata/V1/CloudSpeech.php",
        "Speech/src/V1/RecognitionConfig.php",
        "Speech/src/V1/RecognitionMetadata.php",
        "Speech/src/V1/RecognitionMetadata/InteractionType.php",
        "Speech/src/V1/RecognitionMetadata/MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata/OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata/RecordingDeviceType.php",
        "Speech/src/V1/RecognitionMetadata_InteractionType.php",
        "Speech/src/V1/RecognitionMetadata_MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata_OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata_RecordingDeviceType.php",
        "Speech/src/V1/StreamingRecognitionResult.php",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "58cf48947669b05e3bde5203b030aaf0b1becd52",
      "message": "Prepare v0.101.1 (#1948)",
      "files": [
        "Asset/VERSION",
        "BigQueryDataTransfer/VERSION",
        "Bigtable/VERSION",
        "Bigtable/src/BigtableClient.php",
        "Container/VERSION",
        "Dataproc/VERSION",
        "Debugger/VERSION",
        "Debugger/src/DebuggerClient.php",
        "Dialogflow/VERSION",
        "Dlp/VERSION",
        "ErrorReporting/VERSION",
        "Firestore/VERSION",
        "Firestore/src/FirestoreClient.php",
        "Iot/VERSION",
        "Kms/VERSION",
        "Language/VERSION",
        "Language/src/LanguageClient.php",
        "Logging/VERSION",
        "Logging/src/LoggingClient.php",
        "Monitoring/VERSION",
        "OsLogin/VERSION",
        "PubSub/VERSION",
        "PubSub/src/PubSubClient.php",
        "Redis/VERSION",
        "Scheduler/VERSION",
        "Spanner/VERSION",
        "Spanner/src/SpannerClient.php",
        "Speech/VERSION",
        "Speech/src/SpeechClient.php",
        "Tasks/VERSION",
        "TextToSpeech/VERSION",
        "Trace/VERSION",
        "Trace/src/TraceClient.php",
        "VideoIntelligence/VERSION",
        "Vision/VERSION",
        "Vision/src/VisionClient.php",
        "composer.json",
        "docs/manifest.json",
        "src/ServiceBuilder.php",
        "src/Version.php"
      ]
    },
    {
      "sha": "9e71bb94a4de1ebd09ceb1f4177258ccba9d48c8",
      "message": "Skip commit in release builder (#1947)",
      "files": [
        "dev/src/ReleaseBuilder/ReleaseBuilder.php"
      ]
    },
    {
      "sha": "3ed713a94e29a51ee1b1820de7022556e2152250",
      "message": "Revert \"Add Stackdriver logging config, update documentation. (#1942)\" (#1946)\n\nThis reverts commit 73e2fc4a0e7258329e85cea7e1e9781bdffcaa2c.",
      "files": [
        "Tasks/metadata/V2/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Queue.php",
        "Tasks/src/V2/AppEngineHttpRequest.php",
        "Tasks/src/V2/CloudTasksGrpcClient.php",
        "Tasks/src/V2/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2/ListQueuesRequest.php",
        "Tasks/src/V2/ListTasksRequest.php",
        "Tasks/src/V2beta3/AppEngineHttpRequest.php",
        "Tasks/src/V2beta3/CloudTasksGrpcClient.php",
        "Tasks/src/V2beta3/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2beta3/HttpRequest.php",
        "Tasks/src/V2beta3/ListQueuesRequest.php",
        "Tasks/src/V2beta3/ListTasksRequest.php",
        "Tasks/src/V2beta3/OAuthToken.php",
        "Tasks/src/V2beta3/OidcToken.php",
        "Tasks/src/V2beta3/Queue.php",
        "Tasks/src/V2beta3/StackdriverLoggingConfig.php",
        "Tasks/src/V2beta3/Task.php",
        "Tasks/synth.metadata",
        "Tasks/tests/Unit/V2beta3/CloudTasksClientTest.php"
      ]
    },
    {
      "sha": "0b5a29e7297ff7a9c5ab419bd5fe8966dc0c9160",
      "message": "Revert \"Add recognition metadata, result end time and language code. (#1941)\" (#1945)\n\nThis reverts commit ed9f34f3e6d7e66e30f85b36d614e5e7b31b1ef7.",
      "files": [
        "Speech/metadata/V1/CloudSpeech.php",
        "Speech/src/V1/RecognitionConfig.php",
        "Speech/src/V1/RecognitionMetadata.php",
        "Speech/src/V1/RecognitionMetadata/InteractionType.php",
        "Speech/src/V1/RecognitionMetadata/MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata/OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata/RecordingDeviceType.php",
        "Speech/src/V1/RecognitionMetadata_InteractionType.php",
        "Speech/src/V1/RecognitionMetadata_MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata_OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata_RecordingDeviceType.php",
        "Speech/src/V1/StreamingRecognitionResult.php",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "ed9f34f3e6d7e66e30f85b36d614e5e7b31b1ef7",
      "message": "feat: Add recognition metadata, result end time and language code. (#1941)",
      "files": [
        "Speech/metadata/V1/CloudSpeech.php",
        "Speech/src/V1/RecognitionConfig.php",
        "Speech/src/V1/RecognitionMetadata.php",
        "Speech/src/V1/RecognitionMetadata/InteractionType.php",
        "Speech/src/V1/RecognitionMetadata/MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata/OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata/RecordingDeviceType.php",
        "Speech/src/V1/RecognitionMetadata_InteractionType.php",
        "Speech/src/V1/RecognitionMetadata_MicrophoneDistance.php",
        "Speech/src/V1/RecognitionMetadata_OriginalMediaType.php",
        "Speech/src/V1/RecognitionMetadata_RecordingDeviceType.php",
        "Speech/src/V1/StreamingRecognitionResult.php",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "4521998bc2189675c796bade005eeb2723752e4c",
      "message": "docs: Update documentation. (#1943)",
      "files": [
        "Vision/src/V1/InputConfig.php",
        "Vision/synth.metadata"
      ]
    },
    {
      "sha": "73e2fc4a0e7258329e85cea7e1e9781bdffcaa2c",
      "message": "feat: Add Stackdriver logging config, update documentation. (#1942)",
      "files": [
        "Tasks/metadata/V2/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Cloudtasks.php",
        "Tasks/metadata/V2Beta3/Queue.php",
        "Tasks/src/V2/AppEngineHttpRequest.php",
        "Tasks/src/V2/CloudTasksGrpcClient.php",
        "Tasks/src/V2/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2/ListQueuesRequest.php",
        "Tasks/src/V2/ListTasksRequest.php",
        "Tasks/src/V2beta3/AppEngineHttpRequest.php",
        "Tasks/src/V2beta3/CloudTasksGrpcClient.php",
        "Tasks/src/V2beta3/Gapic/CloudTasksGapicClient.php",
        "Tasks/src/V2beta3/HttpRequest.php",
        "Tasks/src/V2beta3/ListQueuesRequest.php",
        "Tasks/src/V2beta3/ListTasksRequest.php",
        "Tasks/src/V2beta3/OAuthToken.php",
        "Tasks/src/V2beta3/OidcToken.php",
        "Tasks/src/V2beta3/Queue.php",
        "Tasks/src/V2beta3/StackdriverLoggingConfig.php",
        "Tasks/src/V2beta3/Task.php",
        "Tasks/synth.metadata",
        "Tasks/tests/Unit/V2beta3/CloudTasksClientTest.php"
      ]
    },
    {
      "sha": "bb7e5b98d1ba61945eebd6bf1db62b58f4b1e4a4",
      "message": "fix: Update retry configuration (#1940)",
      "files": [
        "Scheduler/src/V1/resources/cloud_scheduler_client_config.json",
        "Scheduler/src/V1beta1/resources/cloud_scheduler_client_config.json",
        "Scheduler/synth.metadata"
      ]
    },
    {
      "sha": "48f9be064ac1ecead7e4c2575557952ff668501b",
      "message": "fix: Update retry configuration (#1933)",
      "files": [
        "Vision/src/V1/resources/image_annotator_client_config.json",
        "Vision/src/V1/resources/product_search_client_config.json",
        "Vision/synth.metadata"
      ]
    },
    {
      "sha": "906ed070241e4d70c8b35bb63a9721f762250a11",
      "message": "fix: Update retry configuration (#1932)",
      "files": [
        "VideoIntelligence/src/V1/Gapic/VideoIntelligenceServiceGapicClient.php",
        "VideoIntelligence/src/V1/resources/video_intelligence_service_client_config.json",
        "VideoIntelligence/src/V1beta2/resources/video_intelligence_service_client_config.json",
        "VideoIntelligence/synth.metadata",
        "VideoIntelligence/tests/System/V1/VideoIntelligenceServiceSmokeTest.php",
        "VideoIntelligence/tests/Unit/V1/VideoIntelligenceServiceClientTest.php"
      ]
    },
    {
      "sha": "0fbfa6889dbe968eb8e16a9c6b6e5e98de8f7120",
      "message": "fix: Update retry configuration (#1931)",
      "files": [
        "Trace/src/V2/resources/trace_service_client_config.json",
        "Trace/synth.metadata"
      ]
    },
    {
      "sha": "d5e8cfb3fe272173c2c9f758ea469de44d6dc35a",
      "message": "fix: Update retry configuration (#1930)",
      "files": [
        "TextToSpeech/src/V1/resources/text_to_speech_client_config.json",
        "TextToSpeech/synth.metadata"
      ]
    },
    {
      "sha": "694ee38f3de591167376e70e2563d94ee5c20e42",
      "message": "fix: Update retry configuration (#1929)",
      "files": [
        "Tasks/src/V2/resources/cloud_tasks_client_config.json",
        "Tasks/src/V2beta2/resources/cloud_tasks_client_config.json",
        "Tasks/src/V2beta3/resources/cloud_tasks_client_config.json",
        "Tasks/synth.metadata"
      ]
    },
    {
      "sha": "9172873c62212de1df612f4ccba3babf44e3d1e1",
      "message": "fix: Update retry configuration (#1928)",
      "files": [
        "Speech/src/V1/resources/speech_client_config.json",
        "Speech/src/V1p1beta1/resources/speech_client_config.json",
        "Speech/synth.metadata"
      ]
    },
    {
      "sha": "7059b29494b42d5779f77c65e44d730df6dc0822",
      "message": "fix: Update retry configuration (#1927)",
      "files": [
        "Spanner/src/Admin/Database/V1/resources/database_admin_client_config.json",
        "Spanner/src/Admin/Instance/V1/resources/instance_admin_client_config.json",
        "Spanner/synth.metadata"
      ]
    },
    {
      "sha": "8885e309cf69409d6734eb7f41ebd77c729ee290",
      "message": "fix: Update retry configuration (#1926)",
      "files": [
        "Redis/src/V1/resources/cloud_redis_client_config.json",
        "Redis/src/V1beta1/resources/cloud_redis_client_config.json",
        "Redis/synth.metadata"
      ]
    },
    {
      "sha": "8c5753c7822219ea99648ea220b1f092742afc34",
      "message": "fix: Update retry configuration (#1925)",
      "files": [
        "PubSub/src/V1/resources/publisher_client_config.json",
        "PubSub/synth.metadata"
      ]
    },
    {
      "sha": "f96ed362253b5f552955ec1e6879d2119ce35a35",
      "message": "fix: Update retry configuration (#1924)",
      "files": [
        "OsLogin/src/V1/resources/os_login_service_client_config.json",
        "OsLogin/src/V1beta/resources/os_login_service_client_config.json",
        "OsLogin/synth.metadata"
      ]
    }
  ]
}
